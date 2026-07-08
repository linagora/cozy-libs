# Assistant Knowledge Base — Backend Enablement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Folder-scoped assistant retrieval: cozy-stack maps a knowledge-base Drive folder to an openRAG workspace (ensure + backfill at chat time, membership reconciliation at index time), and openRAG's workspace deletion gains a non-destructive `keep_files` mode.

**Architecture:** All Cozy-side logic lives in cozy-stack's existing `model/rag` package (`chat.go` chat-time, `index.go` index-time), reusing `CallRAGQuery` for workspace HTTP calls. openRAG change is confined to the `delete_workspace` route handler. No front-end change; no openRAG schema change.

**Tech Stack:** Go (cozy-stack, stdlib + testify), Python/FastAPI (openRAG, pytest).

**Spec:** `docs/superpowers/specs/2026-07-08-assistant-kb-backend-design.md` (in the cozy-libs worktree)

## Global Constraints

- Two working repos:
  - **cozy-stack**: `/home/paul/dev/cozy/server/cozy-stack`, branch `feat/assistant-kb-workspace` off `master`. Run tests with `go test ./model/rag/...`; build with `go build ./...`; also run `go vet ./model/rag/...`.
  - **openRAG**: `/home/paul/dev/linagora/server/openrag`, branch `feat/workspace-keep-files` off `fix-custom-llm`. Tests: `pytest tests/api_tests/test_workspaces.py` style (check how those tests are run — e.g. a compose/fixture harness — and if the api_tests need live services, fall back to adding a narrower unit test; report which ran).
- Commit message titles ≤ 72 characters. Never use bare `git stash` in either repo.
- Data contract (verbatim): assistant docs carry `knowledgeBase: [{"doctype": "io.cozy.files", "folderId": "<dir id>"}]`; workspace_id = folderId; chat scope via `metadata["workspace"] = folderId`; backfill chunk size 500.
- Failure semantics (verbatim from spec): if the workspace cannot be ensured at chat time, the query fails with the standard error event — never silently answer unscoped. Index-time membership reconciliation is best-effort (log + continue) and must never block indexing.
- openRAG `keep_files` default MUST remain false (today's orphan-purge behavior unchanged).

---

### Task 1: openRAG — `keep_files` option on workspace deletion

**Repo:** `/home/paul/dev/linagora/server/openrag` (branch `feat/workspace-keep-files` off `fix-custom-llm`)

**Files:**
- Modify: `openrag/routers/workspaces.py:112-148` (`delete_workspace`)
- Modify: `docs/content/docs/documentation/workspaces.md` (deletion section)
- Test: `tests/api_tests/test_workspaces.py` (extend; there is an existing `test_delete_workspace` at line 64 to mirror)

**Interfaces:**
- Produces: `DELETE /partition/{p}/workspaces/{id}?keep_files=true` → deletes the workspace + membership only; response `{"status": "deleted", "orphaned_files_deleted": 0, "orphaned_files_failed": [], "kept_files": <n>}`. Default (absent/false) behavior byte-identical to today except the additional `kept_files: 0` field.

- [ ] **Step 1: Read the existing test** `tests/api_tests/test_workspaces.py` (fixtures `api_client`, `workspace_partition`, `workspace_id`, and how `test_delete_workspace` indexes files and asserts orphan deletion). Determine the run command for this suite (look for pytest markers/conftest requiring a live server; `tests/api_tests/conftest.py`).

- [ ] **Step 2: Write the failing test** — add to `tests/api_tests/test_workspaces.py`, mirroring `test_delete_workspace`'s fixture usage:

```python
def test_delete_workspace_keep_files(self, api_client, workspace_partition, workspace_id):
    # index one file that belongs ONLY to this workspace (an orphan candidate),
    # exactly like test_delete_workspace does
    file_id = self._index_file_in_workspace(api_client, workspace_partition, workspace_id)

    resp = api_client.delete(
        f"/partition/{workspace_partition}/workspaces/{workspace_id}",
        params={"keep_files": "true"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "deleted"
    assert body["orphaned_files_deleted"] == 0
    assert body["kept_files"] == 1

    # the workspace is gone
    resp = api_client.get(f"/partition/{workspace_partition}/workspaces/{workspace_id}")
    assert resp.status_code == 404

    # but the file is still in the partition
    resp = api_client.get(f"/partition/{workspace_partition}/file/{file_id}")
    assert resp.status_code == 200
```

Adapt helper/fixture names to what `test_delete_workspace` actually uses (the indexing helper may be inline in that test — factor or duplicate as the file's style dictates). Also assert in the EXISTING default-deletion test that behavior is unchanged (it should keep passing untouched).

- [ ] **Step 3: Run it to verify it fails** — with the suite's run command. Expected: 422 (unknown param is ignored by FastAPI, so more likely) assertion failure on `kept_files`.

- [ ] **Step 4: Implement** — in `openrag/routers/workspaces.py`, replace the `delete_workspace` handler (lines 112-148) with:

```python
@router.delete(
    "/partition/{partition}/workspaces/{workspace_id}",
    dependencies=[Depends(require_partition_owner)],
)
async def delete_workspace(
    partition: str,
    workspace_id: str,
    keep_files: bool = False,
    vectordb=Depends(get_vectordb),
    _ws=Depends(require_workspace_in_partition),
):
    orphaned = await call_ray_actor_with_timeout(
        vectordb.delete_workspace.remote(workspace_id),
        timeout=VECTORDB_TIMEOUT,
        task_description=f"delete_workspace({workspace_id})",
    )
    deleted_count = 0
    failed_file_ids: list[str] = []
    kept_files = 0
    if orphaned and keep_files:
        # Orphaned files stay indexed in the partition; only the workspace
        # and its membership rows are removed.
        kept_files = len(orphaned)
    elif orphaned:
        results = await asyncio.gather(
            *[
                call_ray_actor_with_timeout(
                    vectordb.delete_file.remote(file_id, partition),
                    timeout=VECTORDB_TIMEOUT,
                    task_description=f"delete_file({file_id})",
                )
                for file_id in orphaned
            ],
            return_exceptions=True,
        )
        for file_id, result in zip(orphaned, results):
            if isinstance(result, Exception):
                logger.warning("Failed to delete orphaned file from Milvus", file_id=file_id, error=str(result))
                failed_file_ids.append(file_id)
            else:
                deleted_count += 1
    return {
        "status": "deleted",
        "orphaned_files_deleted": deleted_count,
        "orphaned_files_failed": failed_file_ids,
        "kept_files": kept_files,
    }
```

- [ ] **Step 5: Run tests to verify pass** (new test + the pre-existing `test_delete_workspace` unchanged). If the api_tests require live services unavailable locally, add an equivalent narrower test at the routers level (`openrag/routers/test_workspace.py` exists — follow its mocking style) and report exactly which suites ran.

- [ ] **Step 6: Update docs** — `docs/content/docs/documentation/workspaces.md`: in the deletion section, document `?keep_files=true` (workspace + membership removed, files always kept) vs default (orphaned files purged).

- [ ] **Step 7: Commit** — `feat(workspaces): Add keep_files option to workspace deletion`

---

### Task 2: cozy-stack — knowledge-base parsing + pure helpers (with unit tests)

**Repo:** `/home/paul/dev/cozy/server/cozy-stack` (branch `feat/assistant-kb-workspace` off `master`)

**Files:**
- Modify: `model/rag/chat.go` (`chatAssistant` struct, lines 116-141)
- Create: `model/rag/workspace.go` (pure helpers; HTTP parts come in Task 3)
- Create: `model/rag/workspace_test.go`

**Interfaces:**
- Produces (consumed by Tasks 3-4):
  - `chatAssistant.KnowledgeBase []knowledgeBaseEntry` (`json:"knowledgeBase,omitempty"`), `knowledgeBaseEntry{Doctype string `json:"doctype"`; FolderID string `json:"folderId"`}`
  - `func knowledgeBaseFolderID(assistant *chatAssistant) string` — first entry with `Doctype == consts.Files`, else `""`
  - `func diffMembership(desired, actual []string) (toAdd, toRemove []string)` — set difference both ways, order-stable on input order
  - `func chunkStrings(ids []string, size int) [][]string`

- [ ] **Step 1: Write the failing tests** — `model/rag/workspace_test.go` (same style as `chat_test.go`: plain testify, no instance fixtures):

```go
package rag

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestKnowledgeBaseFolderID(t *testing.T) {
	t.Run("returns the folderId of the io.cozy.files entry", func(t *testing.T) {
		a := &chatAssistant{KnowledgeBase: []knowledgeBaseEntry{
			{Doctype: "com.linagora.email", FolderID: "nope"},
			{Doctype: "io.cozy.files", FolderID: "folder-1"},
		}}
		assert.Equal(t, "folder-1", knowledgeBaseFolderID(a))
	})
	t.Run("returns empty without knowledge base", func(t *testing.T) {
		assert.Equal(t, "", knowledgeBaseFolderID(&chatAssistant{}))
		assert.Equal(t, "", knowledgeBaseFolderID(nil))
	})
}

func TestDiffMembership(t *testing.T) {
	toAdd, toRemove := diffMembership([]string{"a", "b"}, []string{"b", "c"})
	assert.Equal(t, []string{"a"}, toAdd)
	assert.Equal(t, []string{"c"}, toRemove)

	toAdd, toRemove = diffMembership(nil, nil)
	assert.Empty(t, toAdd)
	assert.Empty(t, toRemove)
}

func TestChunkStrings(t *testing.T) {
	chunks := chunkStrings([]string{"1", "2", "3", "4", "5"}, 2)
	assert.Equal(t, [][]string{{"1", "2"}, {"3", "4"}, {"5"}}, chunks)
	assert.Empty(t, chunkStrings(nil, 2))
}
```

- [ ] **Step 2: Run to verify failure** — `go test ./model/rag/...` → compile error (undefined symbols).

- [ ] **Step 3: Implement** — in `model/rag/chat.go` extend the struct (after line 120's `Relationships` field):

```go
type chatAssistant struct {
	DocID         string                 `json:"_id,omitempty"`
	DocRev        string                 `json:"_rev,omitempty"`
	Relationships chatAssistantRelations `json:"relationships,omitempty"`
	KnowledgeBase []knowledgeBaseEntry   `json:"knowledgeBase,omitempty"`
}

type knowledgeBaseEntry struct {
	Doctype  string `json:"doctype"`
	FolderID string `json:"folderId"`
}
```

Create `model/rag/workspace.go`:

```go
package rag

import (
	"github.com/cozy/cozy-stack/pkg/consts"
)

// knowledgeBaseFolderID returns the Drive folder scoping the assistant's
// retrieval, or "" when the assistant has no knowledge base.
func knowledgeBaseFolderID(assistant *chatAssistant) string {
	if assistant == nil {
		return ""
	}
	for _, entry := range assistant.KnowledgeBase {
		if entry.Doctype == consts.Files && entry.FolderID != "" {
			return entry.FolderID
		}
	}
	return ""
}

// diffMembership compares the desired and actual workspace memberships of a
// file and returns what must be added and removed.
func diffMembership(desired, actual []string) (toAdd, toRemove []string) {
	actualSet := make(map[string]bool, len(actual))
	for _, id := range actual {
		actualSet[id] = true
	}
	desiredSet := make(map[string]bool, len(desired))
	for _, id := range desired {
		desiredSet[id] = true
		if !actualSet[id] {
			toAdd = append(toAdd, id)
		}
	}
	for _, id := range actual {
		if !desiredSet[id] {
			toRemove = append(toRemove, id)
		}
	}
	return toAdd, toRemove
}

func chunkStrings(ids []string, size int) [][]string {
	var chunks [][]string
	for size > 0 && len(ids) > 0 {
		if len(ids) <= size {
			chunks = append(chunks, ids)
			break
		}
		chunks = append(chunks, ids[:size])
		ids = ids[size:]
	}
	return chunks
}
```

- [ ] **Step 4: Run tests** — `go test ./model/rag/...` → PASS; `go vet ./model/rag/...` clean.
- [ ] **Step 5: Commit** — `feat(rag): Parse assistant knowledge base and add workspace helpers`

---

### Task 3: cozy-stack — chat-time workspace ensure + scoping

**Repo:** cozy-stack, same branch.

**Files:**
- Modify: `model/rag/workspace.go` (add the instance-bound functions)
- Modify: `model/rag/chat.go` (`Query`, around lines 359-380)

**Interfaces:**
- Consumes: `CallRAGQuery(inst, method, body, path, contentType)` (`chat.go:589`), `couchdb.GetDoc`, `vfs.WalkByID(fs Indexer, fileID, walkFn)` (`model/vfs/vfs.go:632`), Task 2 helpers.
- Produces: `buildKnowledgeBaseFolder(inst, *ChatConversation) string`; `ensureWorkspace(inst, logger, folderID) error`; `metadata["workspace"]` set in the completion payload when scoped.

- [ ] **Step 1: Implement `buildKnowledgeBaseFolder`** in `model/rag/workspace.go` — same resolution dance as `buildLLMOverride` (`chat.go:289-303`):

```go
// buildKnowledgeBaseFolder returns the folderId scoping retrieval for the
// conversation's assistant, or "" when unscoped.
func buildKnowledgeBaseFolder(inst *instance.Instance, chat *ChatConversation) string {
	rel, ok := chat.Rels["assistant"]
	if !ok {
		return ""
	}
	relData, _ := rel.Data.(map[string]interface{})
	assistantID, _ := relData["_id"].(string)
	if assistantID == "" {
		return ""
	}
	var assistant chatAssistant
	if err := couchdb.GetDoc(inst, consts.ChatAssistants, assistantID, &assistant); err != nil {
		return ""
	}
	return knowledgeBaseFolderID(&assistant)
}
```

- [ ] **Step 2: Implement `ensureWorkspace` + backfill** in `model/rag/workspace.go`:

```go
const workspaceBackfillChunkSize = 500

// ensureWorkspace makes sure the openRAG workspace mirroring the knowledge
// base folder exists, creating it and backfilling its membership from the
// folder subtree when needed. An error means the query MUST NOT proceed
// unscoped.
func ensureWorkspace(inst *instance.Instance, logger logger.Logger, folderID string) error {
	path := fmt.Sprintf("/partition/%s/workspaces/%s", inst.Domain, folderID)
	res, err := CallRAGQuery(inst, http.MethodGet, nil, path, echo.MIMEApplicationJSON)
	if err != nil {
		return err
	}
	res.Body.Close()
	if res.StatusCode == http.StatusOK {
		return nil
	}
	if res.StatusCode != http.StatusNotFound {
		return fmt.Errorf("workspace check status code: %d", res.StatusCode)
	}

	// The partition may not exist yet on a fresh instance (same pattern as
	// the completion 404 path in Query).
	partRes, err := CallRAGQuery(inst, http.MethodPost, nil, fmt.Sprintf("/partition/%s", inst.Domain), echo.MIMEApplicationJSON)
	if err == nil {
		partRes.Body.Close()
	}

	dir, err := inst.VFS().DirByID(folderID)
	if err != nil {
		return fmt.Errorf("knowledge base folder %s: %w", folderID, err)
	}
	createBody, err := json.Marshal(map[string]interface{}{
		"workspace_id": folderID,
		"display_name": dir.DocName,
	})
	if err != nil {
		return err
	}
	createRes, err := CallRAGQuery(inst, http.MethodPost, createBody, fmt.Sprintf("/partition/%s/workspaces", inst.Domain), echo.MIMEApplicationJSON)
	if err != nil {
		return err
	}
	createRes.Body.Close()
	// 409: someone else created it in the meantime, fine.
	if (createRes.StatusCode < 200 || createRes.StatusCode >= 300) && createRes.StatusCode != http.StatusConflict {
		return fmt.Errorf("workspace creation status code: %d", createRes.StatusCode)
	}

	fileIDs, err := listFolderFileIDs(inst, folderID)
	if err != nil {
		return err
	}
	for _, chunk := range chunkStrings(fileIDs, workspaceBackfillChunkSize) {
		body, err := json.Marshal(map[string]interface{}{"file_ids": chunk})
		if err != nil {
			return err
		}
		addRes, err := CallRAGQuery(inst, http.MethodPost, body, path+"/files", echo.MIMEApplicationJSON)
		if err != nil {
			return err
		}
		addRes.Body.Close()
		// 404 means some ids are not indexed in the partition yet: the
		// indexer converges them later, do not fail the chat for this.
		if addRes.StatusCode >= 500 {
			return fmt.Errorf("workspace backfill status code: %d", addRes.StatusCode)
		}
		if addRes.StatusCode >= 300 {
			logger.Warnf("workspace backfill chunk rejected (status %d)", addRes.StatusCode)
		}
	}
	return nil
}

// listFolderFileIDs walks the folder subtree and returns the ids of the
// (non-trashed) files it contains.
func listFolderFileIDs(inst *instance.Instance, folderID string) ([]string, error) {
	var ids []string
	fs := inst.VFS()
	err := vfs.WalkByID(fs, folderID, func(_ string, dir *vfs.DirDoc, file *vfs.FileDoc, err error) error {
		if err != nil {
			return err
		}
		if file != nil && !file.Trashed {
			ids = append(ids, file.DocID)
		}
		return nil
	})
	return ids, err
}
```

(Adapt the `WalkFn` signature to the real one in `model/vfs/vfs.go:622-640` — check it when implementing; the skeleton above assumes `(name string, dir *DirDoc, file *FileDoc, err error) error`.)

- [ ] **Step 3: Wire into `Query`** — in `chat.go`, after the `metadata` map is built (after line 371, next to `buildLLMOverride`):

```go
	if folderID := buildKnowledgeBaseFolder(inst, &chat); folderID != "" {
		if err := ensureWorkspace(inst, logger, folderID); err != nil {
			logger.Warnf("cannot ensure RAG workspace %s: %s", folderID, err)
			// A folder-scoped assistant must never answer from the whole
			// instance: surface the error to the client and stop.
			publishError(inst, chat.Messages[len(chat.Messages)-1].ID, err)
			return err
		}
		metadata["workspace"] = folderID
	}
```

Use the SAME error-publishing helper the non-200 completion path uses at `chat.go:418-430` (read it; if it is inline rather than a named `publishError` helper, extract or inline equivalently so the client receives the standard `{object:"error"}` event).

- [ ] **Step 4: Build + test** — `go build ./... && go vet ./model/rag/... && go test ./model/rag/...` all green.
- [ ] **Step 5: Commit** — `feat(rag): Scope chat retrieval to assistant knowledge base folder`

---

### Task 4: cozy-stack — index-time membership reconciliation

**Repo:** cozy-stack, same branch.

**Files:**
- Modify: `model/rag/index.go` (`Index` lines 35-72, `callRAGIndexer` lines 74-293)
- Modify: `model/rag/workspace.go` (kb context loader + membership HTTP helpers)
- Test: `model/rag/workspace_test.go` (pure parts: desired-workspace matching)

**Interfaces:**
- Consumes: Tasks 2-3 helpers; `CallRAGQuery`; `couchdb.GetAllDocs` (or the package's existing all-docs idiom) on `consts.ChatAssistants`; `inst.VFS().DirByID`.
- Produces: a `kbContext` computed once per `Index` batch and threaded into `callRAGIndexer`.

- [ ] **Step 1: Failing test for the pure matcher** (add to `workspace_test.go`):

```go
func TestDesiredWorkspaces(t *testing.T) {
	kb := kbContext{
		folders: map[string]string{ // folderID -> folder path
			"kb1": "/Perso/HR",
			"kb2": "/Projects",
		},
		existing: map[string]bool{"kb1": true, "kb2": true},
	}
	assert.Equal(t, []string{"kb1"}, kb.desiredWorkspaces("/Perso/HR/contracts"))
	assert.Equal(t, []string{"kb1"}, kb.desiredWorkspaces("/Perso/HR"))
	assert.Empty(t, kb.desiredWorkspaces("/Perso/HRX"))     // no false prefix match
	assert.Empty(t, kb.desiredWorkspaces("/Elsewhere"))
	kb.existing["kb2"] = false
	assert.Empty(t, kb.desiredWorkspaces("/Projects/x"))    // not created in openRAG yet
}
```

- [ ] **Step 2: Implement `kbContext`** in `model/rag/workspace.go`:

```go
// kbContext carries, for one rag-index batch, the knowledge-base folders
// declared by assistants and which of them already exist as workspaces in
// openRAG (uploads may only reference existing workspaces).
type kbContext struct {
	folders  map[string]string // folderID -> folder path
	existing map[string]bool   // folderID -> workspace exists in openRAG
	dirPaths map[string]string // dir_id -> path cache for the batch
}

func (kb *kbContext) empty() bool { return kb == nil || len(kb.folders) == 0 }

func (kb *kbContext) desiredWorkspaces(parentPath string) []string {
	var ids []string
	for folderID, folderPath := range kb.folders {
		if !kb.existing[folderID] {
			continue
		}
		if parentPath == folderPath || strings.HasPrefix(parentPath, folderPath+"/") {
			ids = append(ids, folderID)
		}
	}
	sort.Strings(ids)
	return ids
}

// loadKBContext queries the assistants and the openRAG workspace list once
// per batch. Any error yields a nil context: indexing proceeds without
// membership reconciliation (best-effort by design).
func loadKBContext(inst *instance.Instance, logger logger.Logger) *kbContext {
	var assistants []chatAssistant
	req := &couchdb.AllDocsRequest{Limit: 1000}
	if err := couchdb.GetAllDocs(inst, consts.ChatAssistants, req, &assistants); err != nil {
		if !couchdb.IsNoDatabaseError(err) {
			logger.Warnf("cannot load assistants for workspace sync: %s", err)
		}
		return nil
	}
	kb := &kbContext{
		folders:  map[string]string{},
		existing: map[string]bool{},
		dirPaths: map[string]string{},
	}
	for i := range assistants {
		folderID := knowledgeBaseFolderID(&assistants[i])
		if folderID == "" {
			continue
		}
		dir, err := inst.VFS().DirByID(folderID)
		if err != nil {
			continue
		}
		kb.folders[folderID] = dir.Fullpath
	}
	if len(kb.folders) == 0 {
		return nil
	}
	res, err := CallRAGQuery(inst, http.MethodGet, nil, fmt.Sprintf("/partition/%s/workspaces", inst.Domain), echo.MIMEApplicationJSON)
	if err != nil {
		logger.Warnf("cannot list RAG workspaces: %s", err)
		return kb // folders known, none marked existing: uploads skip attach
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusOK {
		var body struct {
			Workspaces []struct {
				WorkspaceID string `json:"workspace_id"`
			} `json:"workspaces"`
		}
		if err := json.NewDecoder(res.Body).Decode(&body); err == nil {
			for _, ws := range body.Workspaces {
				if _, ok := kb.folders[ws.WorkspaceID]; ok {
					kb.existing[ws.WorkspaceID] = true
				}
			}
		}
	}
	return kb
}

func (kb *kbContext) parentPath(inst *instance.Instance, dirID string) string {
	if p, ok := kb.dirPaths[dirID]; ok {
		return p
	}
	dir, err := inst.VFS().DirByID(dirID)
	if err != nil {
		return ""
	}
	kb.dirPaths[dirID] = dir.Fullpath
	return dir.Fullpath
}

// reconcileMembership aligns one file's workspace membership with the
// knowledge-base folders containing it. Best-effort: errors are logged.
func reconcileMembership(inst *instance.Instance, logger logger.Logger, kb *kbContext, fileID, dirID string) {
	if kb.empty() {
		return
	}
	desired := kb.desiredWorkspaces(kb.parentPath(inst, dirID))
	res, err := CallRAGQuery(inst, http.MethodGet, nil, fmt.Sprintf("/partition/%s/files/%s/workspaces", inst.Domain, fileID), echo.MIMEApplicationJSON)
	if err != nil {
		logger.Warnf("workspace membership check failed for %s: %s", fileID, err)
		return
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return
	}
	var body struct {
		WorkspaceIDs []string `json:"workspace_ids"`
	}
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return
	}
	// only reconcile workspaces the stack manages (known KB folders)
	var actual []string
	for _, id := range body.WorkspaceIDs {
		if _, ok := kb.folders[id]; ok {
			actual = append(actual, id)
		}
	}
	toAdd, toRemove := diffMembership(desired, actual)
	for _, ws := range toAdd {
		payload, _ := json.Marshal(map[string]interface{}{"file_ids": []string{fileID}})
		if r, err := CallRAGQuery(inst, http.MethodPost, payload, fmt.Sprintf("/partition/%s/workspaces/%s/files", inst.Domain, ws), echo.MIMEApplicationJSON); err == nil {
			r.Body.Close()
		} else {
			logger.Warnf("workspace add failed for %s in %s: %s", fileID, ws, err)
		}
	}
	for _, ws := range toRemove {
		if r, err := CallRAGQuery(inst, http.MethodDelete, nil, fmt.Sprintf("/partition/%s/workspaces/%s/files/%s", inst.Domain, ws, fileID), echo.MIMEApplicationJSON); err == nil {
			r.Body.Close()
		} else {
			logger.Warnf("workspace remove failed for %s in %s: %s", fileID, ws, err)
		}
	}
}
```

- [ ] **Step 3: Thread it through `index.go`**:
  - In `Index` (line 58, before the loop): `kb := loadKBContext(inst, logger)` and pass it: `callRAGIndexer(inst, msg.Doctype, change, kb, logger)` (extend the function signature; also update the call in any other caller — grep `callRAGIndexer`).
  - In `callRAGIndexer`, at the content-unchanged skip branch (lines 170-174), BEFORE `return nil`:

```go
		if !needIndexation {
			// The content did not change but the file may have been
			// moved/renamed: keep the knowledge-base workspaces in sync.
			dirID, _ := change.Doc.Get("dir_id").(string)
			reconcileMembership(inst, logger, kb, change.DocID, dirID)
			return nil
		}
```

  - In the upload builder goroutine (after the `metadata` field is written, lines 247-260), attach the desired workspaces for new files:

```go
			if !kb.empty() {
				if desired := kb.desiredWorkspaces(kb.parentPath(inst, dirID)); len(desired) > 0 {
					wsJSON, err := json.Marshal(desired)
					if err == nil {
						if err := writer.WriteField("workspace_ids", string(wsJSON)); err != nil {
							_ = pw.CloseWithError(err)
							return
						}
					}
				}
			}
```

  Note: for `PUT` re-uploads (changed content), openRAG keeps existing membership; also call `reconcileMembership` after a successful `PUT` (not `POST`) so a simultaneous move+edit converges.

- [ ] **Step 4: Build + tests** — `go build ./... && go vet ./model/rag/... && go test ./model/rag/...` green.
- [ ] **Step 5: Commit** — `feat(rag): Sync knowledge base workspace membership at index time`

---

### Task 5: End-to-end verification on the dev machine

**Repos:** both, plus the running dev environment (`rag.localhost:8080`).

- [ ] **Step 1**: Build the stack binary (`go build -o /tmp/cozy-stack-kb ./cmd/cozy-stack` or the repo's usual build path) — report success. DO NOT restart the user's running `cozy-stack serve` without checking with the controller first (it serves live dev instances).
- [ ] **Step 2**: Determine whether a local openRAG (with workspaces) is reachable by the stack config (find the running stack's config: the `rag:` section; probe `GET /partition/rag.localhost:8080/workspaces`-style endpoints with the configured api key). Report reachability.
- [ ] **Step 3**: If both sides are available and the controller approves a stack restart: restart with the new binary, then with the existing "KB Round Trip" assistant (KB folder set): send a chat via `POST /ai/chat/conversations/e2e-kb-test` (`{"q":"...","assistantID":...}` with a CLI token), then verify on openRAG: the workspace named by the folderId exists, its file list matches the folder, and the completion request carried `metadata.workspace` (openRAG logs or a captured request). Move a file in/out of the folder, push a `rag-index` job, verify membership follows.
- [ ] **Step 4**: Whatever ran or not, write an honest verification report: what was verified end-to-end, what only via unit tests/fake servers, and exact commands used.

---

## Out of scope (tracked in the spec)

- openRAG strict/fail-closed behavior for unknown `metadata.workspace` (deferred by decision).
- Workspace garbage collection from the stack (enabled by Task 1, not implemented here).
- Multi-folder knowledge bases (would switch to per-assistant union workspaces).
- Front-end changes: none.
