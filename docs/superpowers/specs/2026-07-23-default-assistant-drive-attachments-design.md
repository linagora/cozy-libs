# Drive Source Restriction for the Default Assistant

## Summary

Let the user restrict the default assistant's RAG search to a Drive folder
and/or a set of files, picked via Drive's file picker, instead of always
searching the whole instance. The restriction is sent per message as
`attachmentIDs` in the chat payload. Two modes:

- **All my documents** (default, current behavior): no `attachmentIDs` sent.
- **Folder / files selection**: the picked selection is resolved to at most
  1000 file ids sent as `attachmentIDs`; above the limit it is an error.

A third "pure LLM / no RAG" mode (via `POST /ai/v1/chat/completions`) was
considered and deliberately dropped for now: that endpoint is stateless, so
conversations would no longer be persisted server-side. It may come back as a
separate project.

This feature only concerns the **default assistant** (the client-side sentinel
`DEFAULT_ASSISTANT`, which has no CouchDB document). Custom assistants keep
their wizard-configured knowledge base, unchanged.

## Backend API

`POST /ai/chat/conversations/:id` (cozy-stack) already supports
`attachmentIDs: string[]` (note the casing) in its `ChatPayload`. The stack
forwards them to openRAG as `metadata.attachments = [{ id }, ...]`, which
restricts retrieval to those documents. No backend change is required.

## Scope & State

- **Per conversation**: the selection lives in `AssistantProvider` as a map
  `conversationId → selectedDocs`, where `selectedDocs` is the array of
  `io.cozy.files` docs (files and/or folders) returned by the picker. No entry
  means "all my documents". A new conversation therefore always starts in the
  default mode.
- The selection can be changed at any point in the conversation; it applies to
  subsequent messages.

## File Picking

Reuse and generalize `FolderPickerDialog` (Drive `PICK` intent on
`io.cozy.files` in an iframe): add props so callers can configure the intent
`reference` action. The composer use case passes
`reference: { label, allowFolder: true, onlyFolder: false }` and
`multiple: true`, allowing a folder, several files, or a mix. The existing
wizard usage keeps `onlyFolder: true`.

**Dependency**: multi-select and the `reference` action config live on the
unmerged cozy-drive branch `feat/file-picker-reference-option`.

## Resolving attachmentIDs

A hook `useResolvedAttachmentIds(selectedDocs)` returns
`{ attachmentIds, isOverLimit, isLoading, isUnavailable }`.

- Directly picked files contribute their id as-is (no query).
- Each picked folder is expanded by a **recursive traversal by `dir_id`**,
  level by level:
  1. Query `io.cozy.files` with `dir_id = <picked folder id>` → returns the
     folder's children (files and subfolders).
  2. For every subfolder found, run the same query on its `dir_id`, all
     queries of a level **in parallel**; repeat until no subfolder remains.
  3. Accumulate the ids of non-trashed files across all levels.
- Every per-directory query is a **classic cozy-client named query**
  (`as: 'files-by-dir-id-<dirId>'`) with
  `fetchPolicy: CozyClient.fetchPolicies.olderThan(5 * 60 * 1000)`, so results
  are cached in the Redux store and not refetched more than every 5 minutes.
  Store updates arriving through the realtime plugin keep the cached results
  fresh; the hook recomputes from the store, so the resolved list follows
  folder changes during the conversation without extra fetches.
- The resolution is recomputed for each message (cheap thanks to the fetch
  policy): the list is never frozen at selection time.
- **Limit**: as soon as the accumulated file ids exceed 1000, the traversal
  stops and the hook reports `isOverLimit`.

## Composer UI (default assistant only)

Extend `TwakeKnowledgeSelector`: for the default assistant, the static "Drive"
chip becomes a clickable chip with an `ActionsMenu` (same pattern as
`KnowledgeBaseChip`):

- **Default state** — chip "Drive"; menu: "All my documents" (checked) and
  "Choose a folder or files…" which opens the generalized picker dialog.
- **Selection active** — chip label: folder name (single folder), file name
  (single file), otherwise "N items". Menu: "Open in Drive" (folder or the
  file's parent), "Edit…" (reopens the picker), "All my documents" (reset).
- Custom assistants keep the current `KnowledgeBaseChip` behavior untouched.
- Feature flag: `cozy.assistant.attachments.enabled` (same approach as the
  websearch toggle flag).

## Data Flow

1. `AssistantProvider` — holds the `conversationId → selectedDocs` map and its
   setter.
2. `TwakeKnowledgeSelector` — reads/writes the selection for the current
   conversation, renders chip + menu + picker dialog, shows error states.
3. `useResolvedAttachmentIds` — resolves the selection to file ids (queries
   above).
4. `CozyAssistantRuntimeProvider` — reads the resolved
   `{ attachmentIds, isOverLimit, isLoading, isUnavailable }`, passes
   `attachmentIds` in the adapter options (added to the `useMemo` deps).
5. `CozyRealtimeChatAdapter` — new option `attachmentIds?: string[]`; when
   non-empty, adds `attachmentIDs: attachmentIds` to the `fetchJSON` body. No
   fetching inside `run()`.

## Error Handling

A restriction must never silently degrade to an unrestricted search (same
principle as the stack's assistant-resolution errors):

- **Over limit (>1000 files)** — detected reactively by the hook, both at
  selection time and later if the folder grows: the chip switches to an error
  state with an explanatory tooltip/message, and sending is blocked with a
  translated inline error until the selection is changed.
- **Selection unavailable** (folder/files deleted or trashed): chip shows the
  existing "unavailable" pattern; sending is blocked the same way; the user
  edits the selection or resets to "All my documents".
- **Resolution loading** (first expansion of a large tree): sending waits for
  the resolution instead of sending without restriction.

## Tests

- `useResolvedAttachmentIds`: single folder, nested folders (level-by-level
  parallel queries), mixed files+folders selection, trashed files excluded,
  over-limit stop, unavailable selection.
- `CozyRealtimeChatAdapter`: payload with/without `attachmentIDs`, exact
  casing, no field for the default "all documents" mode.
- `TwakeKnowledgeSelector`: menu states, chip labels, error/unavailable
  states, reset.
- Locales: `en.json` / `fr.json` for menu items, chip labels, error messages.

## Decisions

- **Modes**: 2 (all documents / folder-files); pure-LLM dropped for now.
- **Casing**: `attachmentIDs` in the HTTP payload (matches stack).
- **Scope**: per conversation, default = all documents, resets on new
  conversation.
- **Folder expansion**: recursive by `dir_id`, level-by-level, parallel
  queries per level; 1000 files max, error above.
- **Caching**: named queries + `olderThan(5 min)` fetch policy; freshness via
  realtime + Redux store.
- **UI**: single chip extending the existing Drive chip (no extra chip),
  `ActionsMenu` + generalized `FolderPickerDialog`.
- **Dependency**: cozy-drive branch `feat/file-picker-reference-option` for
  multi-select / reference picking.
- **Feature flag**: `cozy.assistant.attachments.enabled`.
