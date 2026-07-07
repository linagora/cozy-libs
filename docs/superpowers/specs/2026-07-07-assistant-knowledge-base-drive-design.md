# Assistant Knowledge Base — Real Drive Integration

**Date:** 2026-07-07
**Status:** Approved design, pending implementation plan
**Scope:** `packages/cozy-search` (this repo) + one contract change in `cozy-drive` (separate repo/deliverable)

## Context

The AI assistant (`packages/cozy-search`) shows Drive/Mail/Chat "knowledge" chips in the
conversation composer. Today this is demo-only: `TwakeKnowledges/DriveKnowledge.jsx` renders a
hardcoded in-memory folder tree, and the selection (`selectedTwakeKnowledge` in
`AssistantProvider`) is never sent to the backend — the chat POST
(`/ai/chat/conversations/{id}`) carries only `q`, `assistantID` and `websearch`.

Assistants are real persisted entities (`io.cozy.ai.chat.assistants`, CRUD via
`cozy-client/models/assistant`), created/edited through the multi-step wizard in
`CreateAssistantSteps/` (steps: BASIC_INFO → MODEL_SELECTION → API_KEY).

cozy-drive already ships a `PICK` / `io.cozy.files` intent (manifest `intents` entry, served at
`/intents` via `cozy-interapp`, documented in `docs/file-picker-intent.md`). Its picker dialog
supports folder navigation and folder selection (`folderSelectable`), but its return payload is
link-oriented (`sharingLink` / `downloadLink`), not a folder reference.

## Goals

- A user creating or editing an assistant can attach **one Drive folder** as its knowledge base,
  picked from real `io.cozy.files` data via Drive's picker intent.
- An assistant's knowledge base is **persisted on the assistant doc** and displayed in the
  composer; clicking it opens the real Drive app on that folder.
- The demo `DriveKnowledge` fake tree is removed.

## Non-goals

- **Backend/RAG wiring.** The chat request does not change; the backend reads `knowledgeBase`
  off the assistant doc. Folder-scoped retrieval is handled separately (openRAG side).
- Mail and Chat knowledge sources: the "Load files" / "From mail" buttons may render behind the
  existing feature flags, but stay non-functional demo for now.
- Multiple folders per assistant (the data model allows it; the UI enforces one).
- Per-conversation knowledge overrides.
- The "OpenBuro `/capabilities/PICK`" protocol (design-only spec in cozy-drive docs) — the
  intent is the mechanism for now; migrating later is possible without data-model changes.

## UX flows

### Create

The BASIC_INFO (first) step of the create-assistant wizard gains a **Knowledge base (optional)**
section (per validated mockup): helper text plus buttons `+ Load files`, `From drive`,
`From mail`. Only **From drive** is functional; the other two are flag-gated demo.

Clicking **From drive** opens Drive's picker intent as an in-app iframe dialog. The wizard stays
mounted, so no draft persistence is needed. On confirm, the chosen folder is held in wizard
state and the section shows a folder chip (name + Drive icon + remove `X`). On cancel, nothing
changes. The assistant — including `knowledgeBase` — is saved at the end of the wizard as today.

### Edit

`EditAssistantDialog` gets the same Knowledge base section, pre-filled from the assistant doc,
with **change** (reopens the picker) and **remove** actions. Saved with the rest of the edit.

### Display in the composer

When the selected assistant has a knowledge base, the composer chip area (today's
`TwakeKnowledgeSelector`) shows one chip with the folder's current name (resolved live from
`io.cozy.files`, so Drive renames are reflected). Clicking it opens the Drive app on that folder
**in a new tab** via `generateWebLink` (same pattern as `Conversations/Sources/FileSourcesItem.jsx`:
slug `drive`, hash `/folder/<folderId>`). This is also where "manage the files" (rename, move,
upload) happens — in the real Drive app.

Editing the KB goes through the edit-assistant dialog, not the chip.

## Data model

New attribute on `io.cozy.ai.chat.assistants`:

```js
knowledgeBase: [
  { doctype: 'io.cozy.files', folderId: '<dir id>' }
]
```

- Array + `doctype` discriminator: extensible to mail/multi-source later without migration.
  A future mail entry would carry its own key (e.g. `mailboxId`).
- UI enforces a single `io.cozy.files` entry for now.
- Only the ID is stored; name/existence are resolved live.

**Caveat to verify at implementation time:** `createAssistant` / `editAssistant` in
`cozy-client/models/assistant` may whitelist attributes. If they drop `knowledgeBase`, either PR
cozy-client or save the attribute with a plain `client.save()` on the doc.

## Drive picker intent — contract extension (cozy-drive deliverable)

The existing `PICK` / `io.cozy.files` intent gains a **folder-reference return mode**. Proposed
contract (final shape to be settled in the cozy-drive repo, on top of the existing
`FilePickerConfig` / `ActionConfig` in `docs/file-picker-intent.md`):

- Request: `action: 'PICK'`, `type: 'io.cozy.files'`, with an action config selecting the new
  mode, e.g. `{ label: <confirm label>, action: 'reference', allowFolder: true }` — alongside
  the existing `sharingLink` / `downloadLink` actions.
- Response entry: `{ id, name, type: 'directory', doctype: 'io.cozy.files' }` — no link
  generation.
- Everything else (iframe handshake via `cozy-interapp` `createService`, cancel/terminate
  semantics, navigation UI) is unchanged.

Implementation note for Drive: the internal `components/FolderPicker` (Move/Duplicate dialog)
already has the right semantics (`onConfirm(folder)`, in-picker folder creation); reusing it or
adding the return mode to `modules/services/components/FilePicker` are both acceptable — the
contract above is what cozy-search depends on.

## Changes in cozy-search

- **New hook** (e.g. `hooks/useKnowledgeBase.js`): owns opening the picker intent
  (via `cozy-interapp` — new dependency of the package), mapping the intent result to a
  `knowledgeBase` entry, and resolving folder name/state
  (`buildFileByIdQuery`-style query on `io.cozy.files`).
- **`CreateAssistantSteps/`**: Knowledge base section on the BASIC_INFO step; selected folder
  kept in the wizard state (`useAssistantDialog.js`) and passed to `createAssistant`.
- **`Views/EditAssistantDialog.jsx`**: same section; included in `editAssistant` payload.
- **`TwakeKnowledges/`**: `DriveKnowledge.jsx` and the drive entry of `TwakeKnowledgePanel`
  removed. The drive chip becomes the KB display chip (folder name, opens Drive in new tab).
  Mail/Chat panels stay flag-gated demo. `selectedTwakeKnowledge.drive` state in
  `AssistantProvider` is removed (superseded by the assistant doc).
- **Intent dialog host**: the picker renders in an iframe dialog inside the current view
  (cozy-ui `IntentDialogOpener` or a thin wrapper around `cozy-interapp`).

## Error handling

- **Picker cancelled** (`service.cancel()`): close dialog, no state change.
- **Intent error**: toast + dialog closed; wizard state intact.
- **Folder deleted/trashed after selection**: chip renders a "folder unavailable" state; the
  edit dialog prompts to re-pick. Never a crash, never a silently empty KB.
- **Save/PATCH failure**: standard wizard error handling (toast, stay on dialog).

## Platform note (flagship)

Inside the flagship app's webview, the intent iframe is regular web content and should work
as-is, but this needs a verification pass on device. The chip's "open Drive in new tab" should
go through `cozy-ui-plus/AppLinker` / `cozy-intent` `openApp` conventions on native. Flagged as
a follow-up check, not solved in this design.

## Testing

- Unit: intent-result → `knowledgeBase` mapping; folder-name resolution states
  (present / missing / trashed).
- RTL: wizard BASIC_INFO section (pick, remove, save payload), edit dialog section, composer
  chip (present, no KB, unavailable folder).
- Intent invocation mocked at the `cozy-interapp` boundary.
- Drive-side picker tests live in the cozy-drive repo.

## Dependencies / sequencing

1. cozy-drive: folder-reference return mode on the PICK intent (contract above).
2. cozy-search: can be developed in parallel against a mocked intent; end-to-end works once
   Drive's mode ships. The data-model and display parts (chip, edit section, persistence) have
   no Drive dependency at all.
3. cozy-client: only if `createAssistant`/`editAssistant` whitelist attributes.
