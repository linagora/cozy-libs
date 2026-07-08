# Assistant Knowledge Base — Backend Enablement (cozy-stack × openRAG)

**Date:** 2026-07-08
**Status:** Approved design, pending implementation plan
**Scope:** cozy-stack (`/home/paul/dev/cozy/server/cozy-stack`, Go) + one small openRAG patch
(`/home/paul/dev/linagora/server/openrag`, Python). No front-end change.
**Companion spec:** `2026-07-07-assistant-knowledge-base-drive-design.md` (front-end, shipped on
branch `feat/assistant-knowledge-base-spec`).

## Context

Assistants (`io.cozy.ai.chat.assistants`) now persist
`knowledgeBase: [{ doctype: 'io.cozy.files', folderId }]`, but retrieval ignores it:

- cozy-stack's `rag-query` worker (`model/rag/chat.go`) POSTs `{rag}/v1/chat/completions` with
  `model: ragondin-{domain}` and `metadata: {websearch, attachments, llm_override}`. The
  assistant doc is already read there (`buildLLMOverride`) but only for external-LLM routing.
- cozy-stack's `rag-index` worker (`model/rag/index.go`) indexes every instance file into
  openRAG partition `{domain}` via `POST/PUT {rag}/indexer/partition/{domain}/file/{id}`
  (multipart; query params already include the file's immediate `dir_id`). Driven by the
  CouchDB changes feed; content-unchanged files are skipped by md5 (which is also why
  moves/renames currently update nothing — known stack TODO).
- openRAG (canonical checkout, branch `fix-custom-llm`) has first-class **workspaces**: a named
  subset of files within one partition (`workspaces` + `workspace_files` tables; membership
  only, no re-embedding). Chat scopes retrieval with `metadata.workspace = "<workspace_id>"`
  → Milvus `file_id IN (members)`; an **empty workspace returns zero results (fail-closed)**.
  Files join a workspace at upload (`workspace_ids` multipart field) or later
  (`POST /partition/{p}/workspaces/{id}/files {"file_ids": [...]}`).

## Goals

- A chat on an assistant whose `knowledgeBase` names a Drive folder retrieves **only from that
  folder's subtree**.
- Membership follows Drive life: files created/uploaded/moved into the folder join the scope;
  files moved out or deleted leave it — via the existing `rag-index` changes-feed worker.
- Assistants without a knowledge base keep today's whole-instance retrieval, unchanged.

## Non-goals

- Front-end changes (none needed — the chat POST body stays `q`/`assistantID`/`websearch`).
- openRAG fail-closed/strict behavior for *unknown* workspace ids in `metadata.workspace`
  (today it warns and silently searches the whole partition). Explicitly deferred per review;
  the stack's ensure-before-query keeps the window small.
- Multi-folder knowledge bases (data model allows it; when the UI grows it, switch to one
  *per-assistant* union workspace — `metadata.workspace` accepts a single id — without
  re-embedding anything).
- Workspace ACLs (openRAG authorization stays per-partition; the stack's existing bearer per
  context already covers workspace routes).
- Garbage-collecting stale workspaces (enabled by the `keep_files` patch below, but the
  collector itself is follow-up work).

## Mapping

| Cozy | openRAG |
|---|---|
| instance (`inst.Domain`) | partition `{domain}` (unchanged) |
| KB folder (`folderId`, 32-hex CouchDB id) | workspace, `workspace_id = folderId` |
| folder name | workspace `display_name` (cosmetic, set at creation) |

`folderId` satisfies openRAG's `workspace_id` charset (alnum/`-`/`_`) and is unique in
practice; workspace routes are partition-scoped anyway.

## Chat-time scoping (cozy-stack, `model/rag/chat.go`)

In the `rag-query` worker (`rag.Query`):

1. `buildKnowledgeBaseFolder(inst, &chat)` — sibling of `buildLLMOverride`: resolves the
   conversation's `assistant` relationship, reads the assistant doc's `knowledgeBase`, returns
   the first `io.cozy.files` entry's `folderId` (or `""`). The `chatAssistant` struct gains the
   `knowledgeBase` field.
2. If a folder is set, **ensure the workspace** before querying:
   - `GET {rag}/partition/{domain}/workspaces/{folderId}` → 200: done.
   - 404 → `POST {rag}/partition/{domain}/workspaces` with
     `{"workspace_id": folderId, "display_name": <folder name>}` (409 tolerated), then
     **backfill**: walk the folder subtree in the VFS, collect non-trashed file ids, and
     `POST {rag}/partition/{domain}/workspaces/{folderId}/files` with `{"file_ids": [...]}` in
     chunks (500 ids per request). Files are already indexed in the partition, so backfill is
     membership only. openRAG rejects ids unknown to the partition with 404 — send chunks
     best-effort and log rejects (the indexer converges them later).
   - Partition may not exist yet on a fresh instance: reuse the existing 404 → create-partition
     → retry pattern already present in the completion path.
3. Inject `metadata["workspace"] = folderId` into the completion payload.

**Failure semantics:** if the workspace cannot be ensured (openRAG error other than the
tolerated ones), the query **fails** with the standard error event
(`io.cozy.ai.chat.events {object:"error"}`). A folder-scoped assistant must never silently
answer from the whole instance.

## Index-time membership (cozy-stack, `model/rag/index.go`)

Per `rag-index` batch (one changes-feed page):

1. Load the KB folder set once: query `io.cozy.ai.chat.assistants` (normal_docs), collect
   distinct `knowledgeBase[].folderId`, resolve each folder's VFS path, and fetch the existing
   workspace ids once (`GET {rag}/partition/{domain}/workspaces`) — openRAG rejects uploads
   naming a nonexistent workspace, so only existing ones may be attached. Skip everything below
   if the KB set is empty (fast path — no behavior change for instances without KBs).
2. For each processed file change, compute **desired membership**: the KB folders whose path is
   a prefix of the file's parent path (ancestor test via VFS dir resolution).
3. Reconcile:
   - New file upload (`POST`): include the `workspace_ids` multipart field with the desired
     workspaces (only those whose workspace already exists in openRAG — creation stays a
     chat-time concern; membership for not-yet-created workspaces is covered by backfill).
   - Content-unchanged skip branch (md5 equal): **before skipping**, reconcile membership —
     `GET {rag}/partition/{domain}/files/{id}/workspaces` → diff with desired → add via
     `POST .../workspaces/{ws}/files`, remove via `DELETE .../workspaces/{ws}/files/{id}`.
     This is precisely the moves/renames hole in today's indexer.
   - Deletion/trash: nothing extra — openRAG cascades file deletion out of all workspaces.
4. Membership calls are best-effort per file (log and continue); the next change or the next
   chat-time backfill converges. Workspace-membership reconciliation must not block indexing.

## openRAG patch: `keep_files` on workspace deletion

Today `DELETE /partition/{p}/workspaces/{id}` also **deletes orphaned files** (files belonging
to no other workspace) from the partition. In the Cozy model most indexed files belong to no
workspace and must stay (they serve unscoped assistants) — so workspace deletion as-is is
destructive and the stack never calls it.

Patch (in `/home/paul/dev/linagora/server/openrag`, branch off `fix-custom-llm`):

- `DELETE /partition/{partition}/workspaces/{workspace_id}?keep_files=true` — removes the
  workspace and its membership rows only; no file/vector deletion. Default (`false` or absent)
  keeps today's orphan-purge behavior, fully backward-compatible.
- Update `docs/content/docs/documentation/workspaces.md` accordingly.
- This unlocks future workspace GC from the stack; no stack code depends on it in this
  iteration.

## Testing

- **cozy-stack**: Go unit tests for the pure parts (assistant `knowledgeBase` parsing, ancestor
  /path-prefix matching, membership diff). HTTP interactions covered by an httptest fake RAG
  server asserting the calls (ensure/create/backfill at chat time; workspace_ids and
  add/remove at index time), following the package's existing test conventions.
- **openRAG**: extend the workspaces tests with the `keep_files=true` deletion case (files
  survive, membership gone) and the default case (unchanged purge).
- **E2E on the dev machine** (rag.localhost): rebuild the stack binary, restart `cozy-stack
  serve`, and — with the local openRAG running — verify: chat on "KB Round Trip" creates the
  workspace, sources come only from the KB folder, moving a file in/out updates membership on
  the next index run. Degrade gracefully if the local openRAG/Milvus stack isn't running:
  verify the stack side against the fake server and report exactly what was and wasn't
  end-to-end verified.

## Sequencing

1. openRAG `keep_files` patch (independent, small).
2. cozy-stack chat-time scoping (delivers the user-visible behavior once folders are backfilled).
3. cozy-stack index-time reconciliation (keeps membership fresh).
4. E2E verification.
