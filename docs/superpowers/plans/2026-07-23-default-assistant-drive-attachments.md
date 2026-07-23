# Default Assistant Drive Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user restrict the default assistant's RAG search to a Drive folder/files (picked via Drive's file picker), sent per message as `attachmentIDs`, with a 1000-file cap.

**Architecture:** Per-conversation selection state lives in `AssistantProvider`. A renderless `AttachmentsResolver` expands picked folders level-by-level (one classic cozy-client `useQueryAll` per directory via a `DirWatcher` child component, 5-min fetch policy, freshness via `RealTimeQueries` + Redux store) and publishes a resolution `{ attachmentIds, isOverLimit, isLoading, isUnavailable }` back into the provider. The composer chip (`DriveSourceChip`) drives selection through a generalized `FolderPickerDialog`; `CozyRealtimeChatAdapter` adds `attachmentIDs` to the POST body and refuses to send while the resolution is blocked.

**Tech Stack:** React 17, cozy-client 60.26 (`useQuery`, `useQueryAll`, `RealTimeQueries`, `fetchPolicies`), cozy-ui (Chip, ActionsMenu), cozy-interapp (Drive `PICK` intent), twake-i18n, jest + @testing-library/react 12 + @testing-library/react-hooks.

**Spec:** `docs/superpowers/specs/2026-07-23-default-assistant-drive-attachments-design.md`

## Global Constraints

- Working directory for all commands: `packages/cozy-search` (repo `cozy-libs`).
- Run tests with `yarn test <path-to-spec>`; full suite with `yarn test`.
- HTTP payload field is exactly `attachmentIDs` (capital `ID`s) — the cozy-stack casing.
- File cap is exactly 1000 (`ATTACHMENTS_MAX_FILES`); above it is an error, never a truncated silent search.
- A restriction must never silently degrade to an unrestricted search: blocked states (loading/over-limit/unavailable) prevent sending.
- Feature flag: `cozy.assistant.attachments.enabled`. Default-assistant-only UI (`DEFAULT_ASSISTANT._id` sentinel from `src/components/constants.js`).
- Fetch policy for directory listing queries: `fetchPolicies.olderThan(5 * 60 * 1000)` (5 minutes).
- Commit message titles must not exceed 72 characters. Use `feat(cozy-search): …` / `test(cozy-search): …` style.
- Plural locale format is polyglot: `"%{smart_count} item |||| %{smart_count} items"`.
- Intent-returned docs carry `id`; store docs carry `_id` — always normalize through `getDocId`.

---

### Task 1: Pure resolution helpers + directory query builder

**Files:**
- Create: `src/components/KnowledgeBase/attachments.js`
- Create: `src/components/KnowledgeBase/attachments.spec.js`
- Modify: `src/components/queries.js` (append after `buildFileByIdQuery`, line 77)

**Interfaces:**
- Consumes: `Q`, `fetchPolicies` from cozy-client; `FILES_DOCTYPE` from `../queries`.
- Produces:
  - `ATTACHMENTS_MAX_FILES = 1000`
  - `getDocId(doc) => string` (`doc._id ?? doc.id`)
  - `collectAttachmentsResolution({ selectedDocs, pickedDocs, pickedFetchStatus, resultsByDirId }) => { dirIds: string[], attachmentIds: string[], isOverLimit: boolean, isLoading: boolean, isUnavailable: boolean }`
  - `isAttachmentsBlocked(selection, resolution) => boolean`
  - `buildFilesByDirIdQuery(dirId) => { definition, options }` in `src/components/queries.js`

- [ ] **Step 1: Write the failing tests**

Create `src/components/KnowledgeBase/attachments.spec.js`:

```js
import {
  ATTACHMENTS_MAX_FILES,
  collectAttachmentsResolution,
  getDocId,
  isAttachmentsBlocked
} from './attachments'
import { buildFilesByDirIdQuery } from '../queries'

const file = (id, attrs = {}) => ({ _id: id, type: 'file', name: id, ...attrs })
const dir = (id, attrs = {}) => ({ _id: id, type: 'directory', name: id, ...attrs })
const loaded = docs => ({ data: docs, fetchStatus: 'loaded', hasMore: false })

describe('getDocId', () => {
  it('prefers _id and falls back to id (intent-returned docs)', () => {
    expect(getDocId({ _id: 'a', id: 'b' })).toBe('a')
    expect(getDocId({ id: 'b' })).toBe('b')
  })
})

describe('collectAttachmentsResolution', () => {
  it('resolves directly picked files without any directory query', () => {
    const picked = [file('f1'), file('f2')]
    const res = collectAttachmentsResolution({
      selectedDocs: picked,
      pickedDocs: picked,
      pickedFetchStatus: 'loaded',
      resultsByDirId: {}
    })
    expect(res.attachmentIds.sort()).toEqual(['f1', 'f2'])
    expect(res.dirIds).toEqual([])
    expect(res.isLoading).toBe(false)
    expect(res.isOverLimit).toBe(false)
    expect(res.isUnavailable).toBe(false)
  })

  it('is loading until the picked docs are fetched', () => {
    const picked = [file('f1')]
    const res = collectAttachmentsResolution({
      selectedDocs: picked,
      pickedDocs: undefined,
      pickedFetchStatus: 'loading',
      resultsByDirId: {}
    })
    expect(res.isLoading).toBe(true)
  })

  it('walks directories level by level and collects nested files', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {
        d1: loaded([file('f1'), dir('d2')]),
        d2: loaded([file('f2')])
      }
    })
    expect(res.dirIds).toEqual(['d1', 'd2'])
    expect(res.attachmentIds.sort()).toEqual(['f1', 'f2'])
    expect(res.isLoading).toBe(false)
  })

  it('is loading while a discovered directory has no loaded result', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([dir('d2')]) }
    })
    expect(res.dirIds).toEqual(['d1', 'd2'])
    expect(res.isLoading).toBe(true)
  })

  it('deduplicates a picked file that also lives in a picked folder', () => {
    const root = dir('d1')
    const dup = file('f1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root, dup],
      pickedDocs: [root, dup],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([file('f1')]) }
    })
    expect(res.attachmentIds).toEqual(['f1'])
  })

  it('ignores trashed files found during traversal', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {
        d1: loaded([file('f1'), file('f2', { trashed: true })])
      }
    })
    expect(res.attachmentIds).toEqual(['f1'])
  })

  it('reports over-limit above ATTACHMENTS_MAX_FILES', () => {
    const root = dir('d1')
    const tooMany = Array.from({ length: ATTACHMENTS_MAX_FILES + 1 }, (_, i) =>
      file(`f${i}`)
    )
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded(tooMany) }
    })
    expect(res.isOverLimit).toBe(true)
  })

  it('reports unavailable when a picked doc was deleted or trashed', () => {
    const gone = file('f1')
    const trashed = file('f2', { trashed: true })
    // deleted: absent from pickedDocs
    expect(
      collectAttachmentsResolution({
        selectedDocs: [gone],
        pickedDocs: [],
        pickedFetchStatus: 'loaded',
        resultsByDirId: {}
      }).isUnavailable
    ).toBe(true)
    // trashed: present but flagged
    expect(
      collectAttachmentsResolution({
        selectedDocs: [trashed],
        pickedDocs: [trashed],
        pickedFetchStatus: 'loaded',
        resultsByDirId: {}
      }).isUnavailable
    ).toBe(true)
  })
})

describe('isAttachmentsBlocked', () => {
  const okResolution = {
    attachmentIds: ['f1'],
    isOverLimit: false,
    isLoading: false,
    isUnavailable: false
  }

  it('never blocks without a selection', () => {
    expect(isAttachmentsBlocked(undefined, undefined)).toBe(false)
    expect(isAttachmentsBlocked([], undefined)).toBe(false)
  })

  it('blocks a selection with no resolution yet', () => {
    expect(isAttachmentsBlocked([file('f1')], undefined)).toBe(true)
  })

  it('blocks loading, over-limit and unavailable resolutions', () => {
    expect(
      isAttachmentsBlocked([file('f1')], { ...okResolution, isLoading: true })
    ).toBe(true)
    expect(
      isAttachmentsBlocked([file('f1')], { ...okResolution, isOverLimit: true })
    ).toBe(true)
    expect(
      isAttachmentsBlocked([file('f1')], {
        ...okResolution,
        isUnavailable: true
      })
    ).toBe(true)
  })

  it('does not block a clean resolution', () => {
    expect(isAttachmentsBlocked([file('f1')], okResolution)).toBe(false)
  })
})

describe('buildFilesByDirIdQuery', () => {
  it('builds a named query on dir_id with a 5-minute fetch policy', () => {
    const query = buildFilesByDirIdQuery('dir-1')
    expect(query.options.as).toBe('io.cozy.files/by-dir-id/dir-1')
    expect(typeof query.options.fetchPolicy).toBe('function')
    const definition = query.definition()
    expect(definition.selector).toEqual({ dir_id: 'dir-1' })
    expect(definition.indexedFields).toEqual(['dir_id'])
    expect(definition.limit).toBe(1000)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/components/KnowledgeBase/attachments.spec.js`
Expected: FAIL — `Cannot find module './attachments'` (and `buildFilesByDirIdQuery` is not exported).

- [ ] **Step 3: Write the implementation**

Create `src/components/KnowledgeBase/attachments.js`:

```js
export const ATTACHMENTS_MAX_FILES = 1000

/**
 * Docs returned by the Drive PICK intent carry `id`; docs from the
 * cozy-client store carry `_id`. Normalize every access through this.
 */
export const getDocId = doc => doc?._id ?? doc?.id

const isTrashed = doc =>
  !!doc?.trashed || !!doc?.path?.startsWith('/.cozy_trash')

/**
 * Expands the picked selection (files and/or folders) into the flat list of
 * file ids to send as `attachmentIDs`, walking folders level by level from
 * per-directory query results.
 *
 * @param {object} params
 * @param {Array<object>} params.selectedDocs - docs picked in the file picker
 * @param {Array<object>|undefined} params.pickedDocs - live versions of the
 *   picked docs (from a byIds query); deleted docs are simply absent
 * @param {string} params.pickedFetchStatus - fetchStatus of the byIds query
 * @param {Object<string, {data: Array<object>|undefined, fetchStatus: string,
 *   hasMore: boolean|undefined}>} params.resultsByDirId - one entry per
 *   watched directory (`useQueryAll` result)
 * @returns {{dirIds: string[], attachmentIds: string[], isOverLimit: boolean,
 *   isLoading: boolean, isUnavailable: boolean}} `dirIds` is the closure of
 *   directories to watch (roots + discovered subfolders, BFS order)
 */
export const collectAttachmentsResolution = ({
  selectedDocs,
  pickedDocs,
  pickedFetchStatus,
  resultsByDirId
}) => {
  const pickedLoaded = pickedFetchStatus === 'loaded'
  const pickedById = new Map(
    (pickedDocs ?? []).map(doc => [getDocId(doc), doc])
  )

  const liveSelected = selectedDocs
    .map(doc => pickedById.get(getDocId(doc)))
    .filter(doc => !!doc && !isTrashed(doc))
  const isUnavailable = pickedLoaded && liveSelected.length < selectedDocs.length

  const dirIds = []
  const seenDirIds = new Set()
  const enqueueDir = id => {
    if (id && !seenDirIds.has(id)) {
      seenDirIds.add(id)
      dirIds.push(id)
    }
  }

  const fileIds = new Set()
  for (const doc of liveSelected) {
    if (doc.type === 'directory') enqueueDir(getDocId(doc))
    else if (doc.type === 'file') fileIds.add(getDocId(doc))
  }

  let isLoading = !pickedLoaded
  for (let i = 0; i < dirIds.length; i++) {
    const result = resultsByDirId[dirIds[i]]
    if (!result || result.fetchStatus !== 'loaded' || result.hasMore) {
      isLoading = true
      continue
    }
    for (const child of result.data ?? []) {
      if (child.type === 'directory') enqueueDir(getDocId(child))
      else if (child.type === 'file' && !isTrashed(child))
        fileIds.add(getDocId(child))
    }
  }

  return {
    dirIds,
    attachmentIds: [...fileIds].slice(0, ATTACHMENTS_MAX_FILES),
    isOverLimit: fileIds.size > ATTACHMENTS_MAX_FILES,
    isLoading,
    isUnavailable
  }
}

/**
 * A restriction must never silently degrade to an unrestricted search:
 * while the selection is loading, over the limit or unavailable, sending
 * is blocked.
 */
export const isAttachmentsBlocked = (selection, resolution) => {
  if (!selection || selection.length === 0) return false
  if (!resolution) return true
  return (
    resolution.isLoading || resolution.isOverLimit || resolution.isUnavailable
  )
}
```

Append to `src/components/queries.js` (after `buildFileByIdQuery`):

```js
const attachmentsFetchPolicy = fetchPolicies.olderThan(5 * 60 * 1000) // 5 minutes

export const buildFilesByDirIdQuery = dirId => ({
  definition: () =>
    Q(FILES_DOCTYPE).where({ dir_id: dirId }).indexFields(['dir_id']).limitBy(1000),
  options: {
    as: `${FILES_DOCTYPE}/by-dir-id/${dirId}`,
    fetchPolicy: attachmentsFetchPolicy
  }
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/components/KnowledgeBase/attachments.spec.js`
Expected: PASS (all tests). If `definition.indexedFields` fails, inspect the built definition (`console.log(query.definition())`) — the property name on `QueryDefinition` is `indexedFields`; adjust the assertion only if cozy-client uses a different property, not the implementation.

- [ ] **Step 5: Commit**

```bash
git add src/components/KnowledgeBase/attachments.js src/components/KnowledgeBase/attachments.spec.js src/components/queries.js
git commit -m "feat(cozy-search): Add attachments resolution helpers"
```

---

### Task 2: Per-conversation selection state in AssistantProvider

**Files:**
- Modify: `src/components/AssistantProvider.jsx`
- Modify: `src/components/AssistantProvider.d.ts`
- Create: `src/components/AssistantProvider.spec.jsx`

**Interfaces:**
- Consumes: nothing new.
- Produces (context additions):
  - `attachmentsSelections: Record<string, Array<object>>` — conversationId → picked docs
  - `setAttachmentsSelection(conversationId: string, docs: Array<object> | null): void` — `null`/`[]` removes the entry
  - `attachmentsResolutions: Record<string, AttachmentsResolution>`
  - `setAttachmentsResolution(conversationId: string, resolution: AttachmentsResolution | null): void` — `null` removes the entry

- [ ] **Step 1: Write the failing test**

Create `src/components/AssistantProvider.spec.jsx`:

```jsx
import { renderHook, act } from '@testing-library/react-hooks'
import React from 'react'

import AssistantProvider, { useAssistant } from './AssistantProvider'

const wrapper = ({ children }) => (
  <AssistantProvider>{children}</AssistantProvider>
)

describe('AssistantProvider attachments state', () => {
  it('stores a selection per conversation and clears it with null', () => {
    const { result } = renderHook(() => useAssistant(), { wrapper })

    expect(result.current.attachmentsSelections).toEqual({})

    const docs = [{ _id: 'f1', type: 'file' }]
    act(() => {
      result.current.setAttachmentsSelection('conv-1', docs)
    })
    expect(result.current.attachmentsSelections).toEqual({ 'conv-1': docs })

    act(() => {
      result.current.setAttachmentsSelection('conv-1', null)
    })
    expect(result.current.attachmentsSelections).toEqual({})
  })

  it('stores a resolution per conversation and clears it with null', () => {
    const { result } = renderHook(() => useAssistant(), { wrapper })

    const resolution = {
      attachmentIds: ['f1'],
      isOverLimit: false,
      isLoading: false,
      isUnavailable: false
    }
    act(() => {
      result.current.setAttachmentsResolution('conv-1', resolution)
    })
    expect(result.current.attachmentsResolutions).toEqual({
      'conv-1': resolution
    })

    act(() => {
      result.current.setAttachmentsResolution('conv-1', null)
    })
    expect(result.current.attachmentsResolutions).toEqual({})
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/AssistantProvider.spec.jsx`
Expected: FAIL — `result.current.attachmentsSelections` is `undefined`.

- [ ] **Step 3: Implement the provider state**

In `src/components/AssistantProvider.jsx`, change the import line to include `useCallback`:

```js
import React, { useMemo, useContext, useState, useCallback } from 'react'
```

After the `websearchEnabled` state (line 29), add:

```js
  // Per-conversation Drive restriction for the default assistant:
  // conversationId → docs picked in the Drive file picker. No entry means
  // "search in all my documents". Resolutions (flat file ids + status) are
  // published back by AttachmentsResolver, keyed the same way.
  const [attachmentsSelections, setAttachmentsSelections] = useState({})
  const [attachmentsResolutions, setAttachmentsResolutions] = useState({})

  const setForConversation = (setState, conversationId, value) => {
    setState(prev => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        if (!(conversationId in prev)) return prev
        const next = { ...prev }
        delete next[conversationId]
        return next
      }
      return { ...prev, [conversationId]: value }
    })
  }

  const setAttachmentsSelection = useCallback((conversationId, docs) => {
    setForConversation(setAttachmentsSelections, conversationId, docs)
  }, [])

  const setAttachmentsResolution = useCallback((conversationId, resolution) => {
    setForConversation(setAttachmentsResolutions, conversationId, resolution)
  }, [])
```

Add to the `value` object: `attachmentsSelections`, `setAttachmentsSelection`, `attachmentsResolutions`, `setAttachmentsResolution`; add `attachmentsSelections` and `attachmentsResolutions` to the `useMemo` dependency array (the two setters are stable `useCallback`s).

In `src/components/AssistantProvider.d.ts`, add before `AssistantContextValue`:

```ts
export interface AttachmentsResolution {
  attachmentIds: string[]
  isOverLimit: boolean
  isLoading: boolean
  isUnavailable: boolean
}

export interface AttachmentsSelectionDoc {
  _id?: string
  id?: string
  type?: string
  name?: string
  dir_id?: string
}
```

And inside `AssistantContextValue`:

```ts
  attachmentsSelections: Record<string, AttachmentsSelectionDoc[]>
  setAttachmentsSelection: (
    conversationId: string,
    docs: AttachmentsSelectionDoc[] | null
  ) => void
  attachmentsResolutions: Record<string, AttachmentsResolution>
  setAttachmentsResolution: (
    conversationId: string,
    resolution: AttachmentsResolution | null
  ) => void
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/AssistantProvider.spec.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/AssistantProvider.jsx src/components/AssistantProvider.d.ts src/components/AssistantProvider.spec.jsx
git commit -m "feat(cozy-search): Add per-conversation attachments state"
```

---

### Task 3: Adapter — attachmentIDs payload + blocked guard

**Files:**
- Modify: `src/components/adapters/CozyRealtimeChatAdapter.ts`
- Modify: `src/components/adapters/CozyRealtimeChatAdapter.spec.ts`

**Interfaces:**
- Consumes: nothing new (pure options).
- Produces: `CozyRealtimeChatAdapterOptions` gains `attachmentIds?: string[]` and `attachmentsBlocked?: boolean`. When `attachmentsBlocked` is true, `run()` yields a translated error (`assistant.attachments.blocked`) and never calls `fetchJSON`. When `attachmentIds` is a non-empty array, the POST body includes `attachmentIDs: attachmentIds`.

- [ ] **Step 1: Extend the spec with failing tests**

In `src/components/adapters/CozyRealtimeChatAdapter.spec.ts`, replace the `runAdapter` helper so it accepts option overrides (keep existing call sites working):

```ts
const runAdapter = async (
  assistantId?: string,
  extraOptions: Record<string, unknown> = {}
): Promise<jest.Mock> => {
  const fetchJSON = jest.fn().mockResolvedValue({})
  const adapter = createCozyRealtimeChatAdapter(
    {
      client: { stackClient: { fetchJSON } },
      conversationId: 'conv-1',
      assistantId,
      ...extraOptions
    },
    key => key,
    { current: makeStreamBridge() }
  )
  const generator = adapter.run(makeRunOptions()) as AsyncGenerator<unknown>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of generator) {
    // drain the generator
  }
  return fetchJSON
}
```

Add a new describe block:

```ts
describe('CozyRealtimeChatAdapter attachments', () => {
  it('sends attachmentIDs when attachmentIds are provided', async () => {
    const fetchJSON = await runAdapter(undefined, {
      attachmentIds: ['f1', 'f2']
    })
    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.objectContaining({ attachmentIDs: ['f1', 'f2'] })
    )
  })

  it('omits attachmentIDs without a selection', async () => {
    const fetchJSON = await runAdapter(undefined)
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('attachmentIDs')
  })

  it('omits attachmentIDs for an empty list', async () => {
    const fetchJSON = await runAdapter(undefined, { attachmentIds: [] })
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('attachmentIDs')
  })

  it('never posts while the attachments resolution is blocked', async () => {
    const fetchJSON = await runAdapter(undefined, {
      attachmentsBlocked: true,
      attachmentIds: ['f1']
    })
    expect(fetchJSON).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the spec to verify the new tests fail**

Run: `yarn test src/components/adapters/CozyRealtimeChatAdapter.spec.ts`
Expected: the 3 pre-existing tests PASS, `sends attachmentIDs…` and `never posts…` FAIL.

- [ ] **Step 3: Implement the adapter changes**

In `src/components/adapters/CozyRealtimeChatAdapter.ts`:

Extend the options interface (line 31):

```ts
export interface CozyRealtimeChatAdapterOptions {
  client: CozyClient
  conversationId: string
  assistantId?: string
  websearchEnabled?: boolean
  attachmentIds?: string[]
  attachmentsBlocked?: boolean
}
```

In `run()`, destructure the new options (line 72):

```ts
    const {
      client,
      conversationId,
      assistantId,
      websearchEnabled,
      attachmentIds,
      attachmentsBlocked
    } = options
```

Right after the `if (!userQuery) { … return }` block (line 79), add the guard:

```ts
    // A Drive restriction must never silently degrade to an unrestricted
    // search: while its resolution is loading, over the 1000-file limit or
    // unavailable, refuse to post (belt-and-braces with the composer block,
    // this also covers assistant-ui's regenerate path).
    if (attachmentsBlocked) {
      yield {
        content: [{ type: 'text', text: t('assistant.attachments.blocked') }],
        status: { type: 'incomplete', reason: 'error' },
        metadata: { custom: { isError: true } }
      }
      return
    }
```

In the `fetchJSON` body (after the `websearchEnabled` spread, line 106), add:

```ts
          ...(attachmentIds &&
            attachmentIds.length > 0 && { attachmentIDs: attachmentIds })
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `yarn test src/components/adapters/CozyRealtimeChatAdapter.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/adapters/CozyRealtimeChatAdapter.ts src/components/adapters/CozyRealtimeChatAdapter.spec.ts
git commit -m "feat(cozy-search): Send attachmentIDs from the chat adapter"
```

---

### Task 4: Generalize FolderPickerDialog (multiple, files+folders)

**Files:**
- Modify: `src/components/KnowledgeBase/FolderPickerDialog.jsx`
- Create: `src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`

**Interfaces:**
- Consumes: existing `Intents` from cozy-interapp.
- Produces: `FolderPickerDialog({ open, onClose, onSelect, multiple = false, onlyFolder = true, selectLabel })`. With `multiple: true`, the intent data gains `multiple: true` and `onSelect` receives an **array** of docs; with the defaults, behavior is byte-for-byte the current one (`onSelect` receives a single doc). `selectLabel` overrides the reference action label (defaults to the current `assistant.knowledge_base.select_folder`).

- [ ] **Step 1: Write the failing test**

Create `src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`:

```jsx
import { render, waitFor } from '@testing-library/react'
import React from 'react'

import FolderPickerDialog from './FolderPickerDialog'

const mockStart = jest.fn()
const mockCreate = jest.fn(() => ({ start: mockStart }))

jest.mock('cozy-interapp', () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)
jest.mock('cozy-client', () => ({ useClient: () => ({}) }))
jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: jest.fn() })
}))
jest.mock('cozy-ui/transpiled/react/Dialog', () => {
  const MockDialog = ({ children }) => <div>{children}</div>
  return {
    __esModule: true,
    default: MockDialog,
    DialogContent: ({ children }) => <div>{children}</div>
  }
})

describe('FolderPickerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the folder-only single-pick intent by default', async () => {
    mockStart.mockResolvedValue([{ id: 'dir-1', type: 'directory' }])
    const onSelect = jest.fn()

    render(
      <FolderPickerDialog open onClose={jest.fn()} onSelect={onSelect} />
    )

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    const [, , intentData] = mockCreate.mock.calls[0]
    expect(intentData.multiple).toBeUndefined()
    expect(intentData.reference).toEqual({
      label: 'assistant.knowledge_base.select_folder',
      allowFolder: true,
      onlyFolder: true
    })
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith({ id: 'dir-1', type: 'directory' })
    )
  })

  it('supports multiple files+folders picking and returns an array', async () => {
    const docs = [
      { id: 'f1', type: 'file' },
      { id: 'dir-1', type: 'directory' }
    ]
    mockStart.mockResolvedValue(docs)
    const onSelect = jest.fn()

    render(
      <FolderPickerDialog
        open
        multiple
        onlyFolder={false}
        selectLabel="assistant.attachments.select"
        onClose={jest.fn()}
        onSelect={onSelect}
      />
    )

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    const [, , intentData] = mockCreate.mock.calls[0]
    expect(intentData.multiple).toBe(true)
    expect(intentData.reference).toEqual({
      label: 'assistant.attachments.select',
      allowFolder: true,
      onlyFolder: false
    })
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(docs))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`
Expected: the default-behavior test may PASS; the `multiple` test FAILS (`intentData.multiple` undefined, `onSelect` called with a single doc).

Note: `mockStart.stop` is undefined — the component calls `startPromise.stop?.()` in cleanup, which tolerates a plain promise.

- [ ] **Step 3: Implement the generalization**

In `src/components/KnowledgeBase/FolderPickerDialog.jsx`, change the signature and the intent effect:

```jsx
const FolderPickerDialog = ({
  open,
  onClose,
  onSelect,
  multiple = false,
  onlyFolder = true,
  selectLabel
}) => {
```

Inside the effect, replace the `intents.create(…)` call and the `.then` handler:

```jsx
    const startPromise = intents
      .create('PICK', 'io.cozy.files', {
        // Drive's FilePickerConfig: null hides an action, so only the
        // side-effect-free `reference` action remains visible
        sharingLink: null,
        downloadLink: null,
        ...(multiple && { multiple: true }),
        reference: {
          label: selectLabel ?? t('assistant.knowledge_base.select_folder'),
          allowFolder: true,
          onlyFolder
        }
      })
      .start(intentHost)

    startPromise
      .then(result => {
        if (cancelled) return undefined
        if (multiple) {
          const docs = (Array.isArray(result) ? result : [result]).filter(
            Boolean
          )
          if (docs.length > 0) {
            onSelect(docs)
          }
        } else {
          const folder = Array.isArray(result) ? result[0] : result
          if (folder) {
            onSelect(folder)
          }
        }
        onClose()
        return undefined
      })
```

Keep the existing `.catch`, cleanup, and JSX unchanged. The effect's dependency comment (`eslint-disable-next-line react-hooks/exhaustive-deps`) stays: `multiple`, `onlyFolder` and `selectLabel` are stable for a dialog's lifetime.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/KnowledgeBase/FolderPickerDialog.jsx src/components/KnowledgeBase/FolderPickerDialog.spec.jsx
git commit -m "feat(cozy-search): Allow multi files+folders picking in dialog"
```

---

### Task 5: AttachmentsResolver renderless component

**Files:**
- Create: `src/components/KnowledgeBase/AttachmentsResolver.jsx`
- Create: `src/components/KnowledgeBase/AttachmentsResolver.spec.jsx`

**Interfaces:**
- Consumes: `useAssistant().setAttachmentsResolution` (Task 2), `collectAttachmentsResolution`/`getDocId` (Task 1), `buildFilesByIds`/`buildFilesByDirIdQuery` (existing + Task 1), `useQuery`/`useQueryAll`/`RealTimeQueries` from cozy-client.
- Produces: `<AttachmentsResolver conversationId={string} selectedDocs={Array<object>} />` — renders no UI; publishes `{ attachmentIds, isOverLimit, isLoading, isUnavailable }` into the provider for `conversationId`, clears it on unmount.

- [ ] **Step 1: Write the failing test**

Create `src/components/KnowledgeBase/AttachmentsResolver.spec.jsx`:

```jsx
import { render } from '@testing-library/react'
import React from 'react'

import { useQuery, useQueryAll } from 'cozy-client'

import AttachmentsResolver from './AttachmentsResolver'
import { AssistantContext } from '../AssistantProvider'

// requireActual keeps Q and fetchPolicies real: buildFilesByDirIdQuery (used
// by the DirWatcher mocks below) builds genuine QueryDefinitions
jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useQuery: jest.fn(),
  useQueryAll: jest.fn(),
  RealTimeQueries: () => null
}))

const file = (id, attrs = {}) => ({ _id: id, type: 'file', name: id, ...attrs })
const dir = (id, attrs = {}) => ({ _id: id, type: 'directory', name: id, ...attrs })

const renderResolver = ({ selectedDocs, pickedResult, resultsByDirId }) => {
  useQuery.mockImplementation(() => pickedResult)
  useQueryAll.mockImplementation(definition => {
    // buildFilesByDirIdQuery definitions are functions; resolve the dirId
    // from the built selector
    const dirId = definition().selector.dir_id
    return (
      resultsByDirId[dirId] ?? { data: undefined, fetchStatus: 'loading' }
    )
  })

  const setAttachmentsResolution = jest.fn()
  const contextValue = { setAttachmentsResolution }
  const view = render(
    <AssistantContext.Provider value={contextValue}>
      <AttachmentsResolver conversationId="conv-1" selectedDocs={selectedDocs} />
    </AssistantContext.Provider>
  )
  return { setAttachmentsResolution, ...view }
}

describe('AttachmentsResolver', () => {
  beforeEach(() => jest.clearAllMocks())

  it('publishes the resolved file ids for a nested folder tree', () => {
    const root = dir('d1')
    const { setAttachmentsResolution } = renderResolver({
      selectedDocs: [root],
      pickedResult: { data: [root], fetchStatus: 'loaded' },
      resultsByDirId: {
        d1: { data: [file('f1'), dir('d2')], fetchStatus: 'loaded', hasMore: false },
        d2: { data: [file('f2')], fetchStatus: 'loaded', hasMore: false }
      }
    })

    expect(setAttachmentsResolution).toHaveBeenLastCalledWith('conv-1', {
      attachmentIds: ['f1', 'f2'],
      isOverLimit: false,
      isLoading: false,
      isUnavailable: false
    })
  })

  it('publishes a loading resolution while a directory is unresolved', () => {
    const root = dir('d1')
    const { setAttachmentsResolution } = renderResolver({
      selectedDocs: [root],
      pickedResult: { data: [root], fetchStatus: 'loaded' },
      resultsByDirId: {}
    })

    expect(setAttachmentsResolution).toHaveBeenLastCalledWith(
      'conv-1',
      expect.objectContaining({ isLoading: true })
    )
  })

  it('clears the resolution on unmount', () => {
    const picked = file('f1')
    const { setAttachmentsResolution, unmount } = renderResolver({
      selectedDocs: [picked],
      pickedResult: { data: [picked], fetchStatus: 'loaded' },
      resultsByDirId: {}
    })

    unmount()
    expect(setAttachmentsResolution).toHaveBeenLastCalledWith('conv-1', null)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/KnowledgeBase/AttachmentsResolver.spec.jsx`
Expected: FAIL — `Cannot find module './AttachmentsResolver'`.

- [ ] **Step 3: Implement the resolver**

Create `src/components/KnowledgeBase/AttachmentsResolver.jsx`:

```jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { RealTimeQueries, useQuery, useQueryAll } from 'cozy-client'

import { collectAttachmentsResolution, getDocId } from './attachments'
import { useAssistant } from '../AssistantProvider'
import { buildFilesByDirIdQuery, buildFilesByIds } from '../queries'

/**
 * Classic named query per directory: cached 5 minutes by fetch policy and
 * kept fresh in the Redux store by RealTimeQueries, so re-renders stay cheap.
 */
const DirWatcher = ({ dirId, onResult }) => {
  const query = buildFilesByDirIdQuery(dirId)
  const { data, fetchStatus, hasMore } = useQueryAll(
    query.definition,
    query.options
  )

  useEffect(() => {
    onResult(dirId, { data, fetchStatus, hasMore })
  }, [dirId, data, fetchStatus, hasMore, onResult])

  return null
}

/**
 * Renderless resolver for the default assistant's Drive restriction: expands
 * the picked selection into the flat list of file ids sent as
 * `attachmentIDs`, walking folders level by level (one DirWatcher per
 * directory — React mounts the next level's watchers as subfolders are
 * discovered, so each level's queries run in parallel). The result is
 * published into AssistantProvider, keyed by conversation.
 */
const AttachmentsResolver = ({ conversationId, selectedDocs }) => {
  const { setAttachmentsResolution } = useAssistant()
  const [resultsByDirId, setResultsByDirId] = useState({})

  const onResult = useCallback((dirId, result) => {
    setResultsByDirId(prev => {
      const previous = prev[dirId]
      if (
        previous &&
        previous.data === result.data &&
        previous.fetchStatus === result.fetchStatus &&
        previous.hasMore === result.hasMore
      ) {
        return prev
      }
      return { ...prev, [dirId]: result }
    })
  }, [])

  // Watch the picked docs themselves (rename, trash, deletion)
  const pickedIds = useMemo(() => selectedDocs.map(getDocId), [selectedDocs])
  const pickedQuery = buildFilesByIds(pickedIds, pickedIds.length > 0)
  const { data: pickedDocs, fetchStatus: pickedFetchStatus } = useQuery(
    pickedQuery.definition,
    pickedQuery.options
  )

  const resolution = useMemo(
    () =>
      collectAttachmentsResolution({
        selectedDocs,
        pickedDocs,
        pickedFetchStatus,
        resultsByDirId
      }),
    [selectedDocs, pickedDocs, pickedFetchStatus, resultsByDirId]
  )

  // Publish by value: the provider state must only change when the resolved
  // content changes, or the adapter would be pointlessly recreated.
  const { dirIds } = resolution
  const serializedResolution = JSON.stringify({
    attachmentIds: resolution.attachmentIds,
    isOverLimit: resolution.isOverLimit,
    isLoading: resolution.isLoading,
    isUnavailable: resolution.isUnavailable
  })

  useEffect(() => {
    setAttachmentsResolution(conversationId, JSON.parse(serializedResolution))
  }, [conversationId, serializedResolution, setAttachmentsResolution])

  useEffect(() => {
    return () => setAttachmentsResolution(conversationId, null)
  }, [conversationId, setAttachmentsResolution])

  return (
    <>
      <RealTimeQueries doctype="io.cozy.files" />
      {dirIds.map(dirId => (
        <DirWatcher key={dirId} dirId={dirId} onResult={onResult} />
      ))}
    </>
  )
}

export default AttachmentsResolver
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/KnowledgeBase/AttachmentsResolver.spec.jsx`
Expected: PASS (3 tests). Also rerun Task 1's spec (`yarn test src/components/KnowledgeBase/`) to confirm nothing regressed.

- [ ] **Step 5: Commit**

```bash
git add src/components/KnowledgeBase/AttachmentsResolver.jsx src/components/KnowledgeBase/AttachmentsResolver.spec.jsx
git commit -m "feat(cozy-search): Add renderless Drive attachments resolver"
```

---

### Task 6: Locales for the attachments UI

**Files:**
- Modify: `src/locales/en.json` (inside the `assistant` object, after the `knowledge_base` block, line 79)
- Modify: `src/locales/fr.json` (same position in the `assistant` object)

**Interfaces:**
- Produces translation keys `assistant.attachments.{all_documents,choose,edit,items,over_limit,unavailable,blocked,select}` used by Tasks 3, 7 and 8. (Task 3's adapter test uses `t = key => key`, so it passes before this task; the real string ships here.)

- [ ] **Step 1: Add the English keys**

In `src/locales/en.json`, after the `"knowledge_base": { … }` block (still inside `"assistant"`), add:

```json
    "attachments": {
      "all_documents": "All my documents",
      "choose": "Choose a folder or files…",
      "edit": "Edit selection…",
      "items": "%{smart_count} item |||| %{smart_count} items",
      "over_limit": "Selection exceeds 1,000 files",
      "unavailable": "Selection unavailable",
      "blocked": "Adjust your Drive selection before sending your message.",
      "select": "Select"
    }
```

- [ ] **Step 2: Add the French keys**

In `src/locales/fr.json`, same position:

```json
    "attachments": {
      "all_documents": "Tous mes documents",
      "choose": "Choisir un dossier ou des fichiers…",
      "edit": "Modifier la sélection…",
      "items": "%{smart_count} élément |||| %{smart_count} éléments",
      "over_limit": "La sélection dépasse 1 000 fichiers",
      "unavailable": "Sélection indisponible",
      "blocked": "Ajustez votre sélection Drive avant d'envoyer votre message.",
      "select": "Sélectionner"
    }
```

- [ ] **Step 3: Validate JSON**

Run: `node -e "require('./src/locales/en.json'); require('./src/locales/fr.json'); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/fr.json
git commit -m "feat(cozy-search): Add attachments selection locales"
```

---

### Task 7: DriveSourceChip component

**Files:**
- Create: `src/components/TwakeKnowledges/DriveSourceChip.jsx`
- Create: `src/components/TwakeKnowledges/DriveSourceChip.spec.jsx`

**Interfaces:**
- Consumes: `useAssistant()` state from Task 2, `FolderPickerDialog` (Task 4), `getDocId` (Task 1), locales (Task 6).
- Produces: `<DriveSourceChip conversationId={string} isLast={boolean} />` — the default assistant's clickable Drive chip with menu, picker, and error labels. Selection writes go through `setAttachmentsSelection(conversationId, docsArray | null)`.

- [ ] **Step 1: Write the failing test**

Create `src/components/TwakeKnowledges/DriveSourceChip.spec.jsx`:

```jsx
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import DriveSourceChip from './DriveSourceChip'
import { AssistantContext } from '../AssistantProvider'

jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('cozy-client', () => ({
  useClient: () => ({
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }),
  generateWebLink: ({ hash }) => `https://drive/#${hash}`
}))
jest.mock('@linagora/twake-icons', () => ({
  Icon: () => null,
  Dropdown: () => null,
  LinkOut: () => null,
  Pen: () => null
}))
jest.mock('cozy-ui/transpiled/react/Chips', () => {
  const MockChip = ({ label, onClick }) => (
    <button data-testid="chip" onClick={onClick}>
      {label}
    </button>
  )
  return { __esModule: true, default: MockChip }
})
jest.mock('cozy-ui/transpiled/react/ActionsMenu', () => {
  const MockMenu = ({ children }) => <div role="menu">{children}</div>
  return { __esModule: true, default: MockMenu }
})
jest.mock('cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem', () => {
  const MockItem = ({ children, onClick, ...props }) => (
    <button role="menuitem" onClick={onClick} {...props}>
      {children}
    </button>
  )
  return { __esModule: true, default: MockItem }
})
jest.mock('cozy-ui/transpiled/react/Typography', () => {
  const MockTypography = ({ children }) => <span>{children}</span>
  return { __esModule: true, default: MockTypography }
})
jest.mock('../KnowledgeBase/FolderPickerDialog', () => {
  const MockPicker = ({ onSelect }) => (
    <button
      data-testid="picker"
      onClick={() => onSelect([{ id: 'd1', type: 'directory', name: 'Bills' }])}
    >
      picker
    </button>
  )
  return { __esModule: true, default: MockPicker }
})

const renderChip = ({ selection, resolution } = {}) => {
  const setAttachmentsSelection = jest.fn()
  const contextValue = {
    attachmentsSelections: selection ? { 'conv-1': selection } : {},
    attachmentsResolutions: resolution ? { 'conv-1': resolution } : {},
    setAttachmentsSelection
  }
  render(
    <AssistantContext.Provider value={contextValue}>
      <DriveSourceChip conversationId="conv-1" isLast />
    </AssistantContext.Provider>
  )
  return { setAttachmentsSelection }
}

describe('DriveSourceChip', () => {
  it('shows the generic Drive label and offers picking from the menu', () => {
    renderChip()
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.twake_knowledges.drive'
    )

    fireEvent.click(screen.getByTestId('chip'))
    expect(
      screen.getByText('assistant.attachments.all_documents')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('assistant.attachments.choose'))
    expect(screen.getByTestId('picker')).toBeInTheDocument()
  })

  it('stores the picked docs for the conversation', () => {
    const { setAttachmentsSelection } = renderChip()
    fireEvent.click(screen.getByTestId('chip'))
    fireEvent.click(screen.getByText('assistant.attachments.choose'))
    fireEvent.click(screen.getByTestId('picker'))
    expect(setAttachmentsSelection).toHaveBeenCalledWith('conv-1', [
      { id: 'd1', type: 'directory', name: 'Bills' }
    ])
  })

  it('labels a single selected folder with its name and can reset', () => {
    const { setAttachmentsSelection } = renderChip({
      selection: [{ id: 'd1', type: 'directory', name: 'Bills' }]
    })
    expect(screen.getByTestId('chip')).toHaveTextContent('Bills')

    fireEvent.click(screen.getByTestId('chip'))
    fireEvent.click(screen.getByText('assistant.attachments.all_documents'))
    expect(setAttachmentsSelection).toHaveBeenCalledWith('conv-1', null)
  })

  it('labels a multi selection with the item count', () => {
    renderChip({
      selection: [
        { id: 'f1', type: 'file', name: 'a.pdf' },
        { id: 'f2', type: 'file', name: 'b.pdf' }
      ]
    })
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.attachments.items'
    )
  })

  it('surfaces over-limit and unavailable states on the label', () => {
    renderChip({
      selection: [{ id: 'd1', type: 'directory', name: 'Bills' }],
      resolution: {
        attachmentIds: [],
        isOverLimit: true,
        isLoading: false,
        isUnavailable: false
      }
    })
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.attachments.over_limit'
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/TwakeKnowledges/DriveSourceChip.spec.jsx`
Expected: FAIL — `Cannot find module './DriveSourceChip'`.

- [ ] **Step 3: Implement the chip**

Create `src/components/TwakeKnowledges/DriveSourceChip.jsx`:

```jsx
import { Icon, Dropdown, LinkOut, Pen } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useRef, useState } from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import TDrive from '../../assets/tdrive.png'
import { useAssistant } from '../AssistantProvider'
import { getDocId } from '../KnowledgeBase/attachments'
import FolderPickerDialog from '../KnowledgeBase/FolderPickerDialog'

/**
 * Default-assistant Drive chip: by default it stands for "search in all my
 * documents"; through its menu the user can restrict the search to a Drive
 * folder and/or files for the current conversation (sent as attachmentIDs).
 */
const DriveSourceChip = ({ conversationId, isLast }) => {
  const { t } = useI18n()
  const client = useClient()
  const chipRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const {
    attachmentsSelections,
    attachmentsResolutions,
    setAttachmentsSelection
  } = useAssistant()

  const selection = attachmentsSelections[conversationId] ?? []
  const resolution = attachmentsResolutions[conversationId]
  const hasSelection = selection.length > 0

  const closeMenu = () => setIsMenuOpen(false)

  const handleChoose = () => {
    closeMenu()
    setIsPickerOpen(true)
  }

  const handleReset = () => {
    closeMenu()
    setAttachmentsSelection(conversationId, null)
  }

  const singleDirectory =
    selection.length === 1 && selection[0].type === 'directory'
      ? selection[0]
      : null
  const folderUrl = singleDirectory
    ? generateWebLink({
        slug: 'drive',
        cozyUrl: client?.getStackClient().uri,
        subDomainType: client?.getInstanceOptions().subdomain,
        hash: `/folder/${getDocId(singleDirectory)}`
      })
    : null

  const label = !hasSelection
    ? t('assistant.twake_knowledges.drive')
    : resolution?.isUnavailable
      ? t('assistant.attachments.unavailable')
      : resolution?.isOverLimit
        ? t('assistant.attachments.over_limit')
        : selection.length === 1
          ? selection[0].name
          : t('assistant.attachments.items', { smart_count: selection.length })

  return (
    <>
      <div ref={chipRef} className={cx({ 'u-mr-half': !isLast })}>
        <Chip
          icon={
            <img
              alt=""
              aria-hidden="true"
              src={TDrive}
              width={16}
              className="u-m-0"
            />
          }
          label={
            <span className="u-flex u-flex-items-center">
              {label}
              <Icon icon={Dropdown} size={16} className="u-ml-half" />
            </span>
          }
          variant="ghost"
          clickable
          onClick={() => setIsMenuOpen(true)}
          className="u-w-auto u-ph-half u-mr-0"
        />
      </div>
      {isMenuOpen && (
        <ActionsMenu
          open
          ref={chipRef}
          onClose={closeMenu}
          actions={[]}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {hasSelection && folderUrl && (
            <ActionsMenuItem
              component="a"
              href={folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              <div className="u-flex u-flex-items-center">
                <Icon icon={LinkOut} size={16} className="u-mr-half" />
                <Typography variant="body1">
                  {t('assistant.knowledge_base.open_folder')}
                </Typography>
              </div>
            </ActionsMenuItem>
          )}
          {!hasSelection && (
            <ActionsMenuItem selected onClick={closeMenu}>
              <Typography variant="body1">
                {t('assistant.attachments.all_documents')}
              </Typography>
            </ActionsMenuItem>
          )}
          <ActionsMenuItem onClick={handleChoose}>
            <div className="u-flex u-flex-items-center">
              <Icon icon={Pen} size={16} className="u-mr-half" />
              <Typography variant="body1">
                {t(
                  hasSelection
                    ? 'assistant.attachments.edit'
                    : 'assistant.attachments.choose'
                )}
              </Typography>
            </div>
          </ActionsMenuItem>
          {hasSelection && (
            <ActionsMenuItem onClick={handleReset}>
              <Typography variant="body1">
                {t('assistant.attachments.all_documents')}
              </Typography>
            </ActionsMenuItem>
          )}
        </ActionsMenu>
      )}
      {isPickerOpen && (
        <FolderPickerDialog
          open
          multiple
          onlyFolder={false}
          selectLabel={t('assistant.attachments.select')}
          onClose={() => setIsPickerOpen(false)}
          onSelect={docs => setAttachmentsSelection(conversationId, docs)}
        />
      )}
    </>
  )
}

export default DriveSourceChip
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/TwakeKnowledges/DriveSourceChip.spec.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/TwakeKnowledges/DriveSourceChip.jsx src/components/TwakeKnowledges/DriveSourceChip.spec.jsx
git commit -m "feat(cozy-search): Add Drive source chip with folder picking"
```

---

### Task 8: Wire everything — selector, composer block, runtime provider

**Files:**
- Modify: `src/components/TwakeKnowledges/TwakeKnowledgeSelector.jsx`
- Create: `src/components/TwakeKnowledges/TwakeKnowledgeSelector.spec.jsx`
- Modify: `src/components/Conversations/ConversationComposer.jsx`
- Modify: `src/components/CozyAssistantRuntimeProvider.tsx`

**Interfaces:**
- Consumes: `DriveSourceChip` (Task 7), `AttachmentsResolver` (Task 5), `isAttachmentsBlocked` (Task 1), provider state (Task 2), adapter options (Task 3), flag `cozy.assistant.attachments.enabled`, `useParams` from react-router-dom.
- Produces: the end-to-end feature.

- [ ] **Step 1: Write the failing selector test**

Create `src/components/TwakeKnowledges/TwakeKnowledgeSelector.spec.jsx`:

```jsx
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

import TwakeKnowledgeSelector from './TwakeKnowledgeSelector'
import { AssistantContext } from '../AssistantProvider'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

jest.mock('cozy-flags', () => jest.fn())
jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('react-router-dom', () => ({
  useParams: () => ({ conversationId: 'conv-1' })
}))
jest.mock('../KnowledgeBase/useSelectedAssistantKnowledgeBase', () => ({
  useSelectedAssistantKnowledgeBase: jest.fn()
}))
jest.mock('./DriveSourceChip', () => {
  const MockDriveSourceChip = () => <div data-testid="drive-source-chip" />
  return { __esModule: true, default: MockDriveSourceChip }
})
jest.mock('./TwakeKnowledgeChip', () => {
  const MockStaticChip = () => <div data-testid="static-chip" />
  return { __esModule: true, default: MockStaticChip }
})
jest.mock('./WebSearchChip', () => {
  const MockWebSearchChip = () => null
  return { __esModule: true, default: MockWebSearchChip }
})
jest.mock('../KnowledgeBase/KnowledgeBaseChip', () => {
  const MockKbChip = () => <div data-testid="kb-chip" />
  return { __esModule: true, default: MockKbChip }
})
jest.mock('../KnowledgeBase/AttachmentsResolver', () => {
  const MockResolver = () => <div data-testid="attachments-resolver" />
  return { __esModule: true, default: MockResolver }
})

const renderSelector = ({
  attachmentsFlag = true,
  isRealAssistant = false,
  dirId = null,
  selection
} = {}) => {
  flag.mockImplementation(
    name => name === 'cozy.assistant.attachments.enabled' && attachmentsFlag
  )
  useSelectedAssistantKnowledgeBase.mockReturnValue({
    dirId,
    folder: null,
    isUnavailable: false,
    setKnowledgeBaseFolder: jest.fn(),
    isRealAssistant,
    hasEmail: false
  })
  const contextValue = {
    attachmentsSelections: selection ? { 'conv-1': selection } : {},
    attachmentsResolutions: {},
    setAttachmentsSelection: jest.fn()
  }
  render(
    <AssistantContext.Provider value={contextValue}>
      <TwakeKnowledgeSelector />
    </AssistantContext.Provider>
  )
}

describe('TwakeKnowledgeSelector', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the interactive Drive chip for the default assistant', () => {
    renderSelector()
    expect(screen.getByTestId('drive-source-chip')).toBeInTheDocument()
    expect(screen.queryByTestId('static-chip')).not.toBeInTheDocument()
  })

  it('keeps the static Drive chip when the flag is off', () => {
    renderSelector({ attachmentsFlag: false })
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
    expect(screen.getByTestId('static-chip')).toBeInTheDocument()
  })

  it('keeps the static Drive chip for a custom assistant without KB', () => {
    renderSelector({ isRealAssistant: true })
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
    expect(screen.getByTestId('static-chip')).toBeInTheDocument()
  })

  it('keeps the knowledge-base chip for a custom assistant with KB', () => {
    renderSelector({ isRealAssistant: true, dirId: 'kb-dir' })
    expect(screen.getByTestId('kb-chip')).toBeInTheDocument()
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
  })

  it('mounts the resolver only when a selection is active', () => {
    renderSelector()
    expect(
      screen.queryByTestId('attachments-resolver')
    ).not.toBeInTheDocument()

    renderSelector({ selection: [{ id: 'd1', type: 'directory' }] })
    expect(screen.getByTestId('attachments-resolver')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/TwakeKnowledges/TwakeKnowledgeSelector.spec.jsx`
Expected: FAIL — `drive-source-chip` never rendered (selector still renders the static chip), and `useParams` unused.

- [ ] **Step 3: Implement the selector wiring**

In `src/components/TwakeKnowledges/TwakeKnowledgeSelector.jsx`:

Add imports:

```js
import { useParams } from 'react-router-dom'

import DriveSourceChip from './DriveSourceChip'
import { useAssistant } from '../AssistantProvider'
import AttachmentsResolver from '../KnowledgeBase/AttachmentsResolver'
```

Inside the component, after the `useSelectedAssistantKnowledgeBase()` call:

```js
  const { conversationId } = useParams()
  const { attachmentsSelections } = useAssistant()

  const attachmentsFlag = flag('cozy.assistant.attachments.enabled')
  const canRestrictDrive =
    !!attachmentsFlag && !isRealAssistant && !!conversationId
  const attachmentsSelection = conversationId
    ? attachmentsSelections[conversationId]
    : undefined
```

Replace the `hasKnowledgeBase ? … : …` JSX block:

```jsx
      {hasKnowledgeBase ? (
        <KnowledgeBaseChip
          dirId={dirId}
          folder={folder}
          isUnavailable={isUnavailable}
          isLast={!showSourceChips}
          onChangeFolder={setKnowledgeBaseFolder}
        />
      ) : canRestrictDrive ? (
        <DriveSourceChip
          conversationId={conversationId}
          isLast={!showSourceChips}
        />
      ) : (
        <TwakeKnowledgeChip
          twakeKnowledge={{
            id: 'drive',
            label: t('assistant.twake_knowledges.drive'),
            icon: TDrive
          }}
          isSelected
          isLast={!showSourceChips}
        />
      )}
```

After that block (still inside the root `div`), mount the resolver:

```jsx
      {canRestrictDrive && attachmentsSelection?.length > 0 && (
        <AttachmentsResolver
          conversationId={conversationId}
          selectedDocs={attachmentsSelection}
        />
      )}
```

Also update the block comment above `twakeKnowledges` (lines 36-42): the Drive chip is no longer always static — for the default assistant (behind `cozy.assistant.attachments.enabled`) it restricts the search to a picked folder/files for the current conversation.

- [ ] **Step 4: Run the selector test to verify it passes**

Run: `yarn test src/components/TwakeKnowledges/TwakeKnowledgeSelector.spec.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Block sending from the composer while unresolved**

In `src/components/Conversations/ConversationComposer.jsx`:

Add imports:

```js
import { useParams } from 'react-router-dom'

import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { isAttachmentsBlocked } from '../KnowledgeBase/attachments'
```

Inside the component:

```js
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const { conversationId } = useParams()
  const {
    websearchEnabled,
    setWebsearchEnabled,
    attachmentsSelections,
    attachmentsResolutions
  } = useAssistant()

  const attachmentsBlocked = isAttachmentsBlocked(
    conversationId ? attachmentsSelections[conversationId] : undefined,
    conversationId ? attachmentsResolutions[conversationId] : undefined
  )
```

Update `handleSend`:

```js
  const handleSend = useCallback(() => {
    if (attachmentsBlocked) {
      showAlert({
        message: t('assistant.attachments.blocked'),
        severity: 'error'
      })
      return
    }
    composerRuntime.send()
  }, [composerRuntime, attachmentsBlocked, showAlert, t])
```

(`useAssistant` destructuring replaces the existing line 26.)

- [ ] **Step 6: Pass the resolution into the adapter**

In `src/components/CozyAssistantRuntimeProvider.tsx`:

Add the import:

```ts
import { isAttachmentsBlocked } from './KnowledgeBase/attachments'
```

In `CozyAssistantRuntimeProviderInner`, replace the `useAssistant()` destructuring (line 153):

```ts
  const {
    selectedAssistantId,
    websearchEnabled,
    attachmentsSelections,
    attachmentsResolutions
  } = useAssistant()

  const attachmentsSelection = attachmentsSelections[conversationId]
  const attachmentsResolution = attachmentsResolutions[conversationId]
  const attachmentIds =
    attachmentsSelection && attachmentsSelection.length > 0
      ? attachmentsResolution?.attachmentIds
      : undefined
  const attachmentsBlocked = isAttachmentsBlocked(
    attachmentsSelection,
    attachmentsResolution
  )
```

Extend the adapter `useMemo` (line 302): add `attachmentIds` and `attachmentsBlocked` to the options object, and to the dependency array:

```ts
  const adapter = useMemo(
    () =>
      createCozyRealtimeChatAdapter(
        {
          client: client as Parameters<
            typeof createCozyRealtimeChatAdapter
          >[0]['client'],
          conversationId,
          assistantId: selectedAssistantId,
          websearchEnabled,
          attachmentIds,
          attachmentsBlocked
        },
        t,
        // eslint-disable-next-line react-hooks/refs -- streamBridgeRef is stable and only read inside adapter.run(), not during render
        streamBridgeRef
      ),
    [
      client,
      conversationId,
      selectedAssistantId,
      websearchEnabled,
      attachmentIds,
      attachmentsBlocked,
      t
    ]
  )
```

(`attachmentIds` identity is stable between renders because `AttachmentsResolver` only republishes when the serialized resolution changes.)

- [ ] **Step 7: Run the full suite, typecheck and lint**

Run: `yarn test`
Expected: PASS across the package.

Run: `yarn build` (from `packages/cozy-search`; runs `tsc -p tsconfig-build.json` via `build:types`)
Expected: no TypeScript errors (the `.d.ts` from Task 2 must satisfy `CozyAssistantRuntimeProvider.tsx`).

- [ ] **Step 8: Commit**

```bash
git add src/components/TwakeKnowledges/TwakeKnowledgeSelector.jsx src/components/TwakeKnowledges/TwakeKnowledgeSelector.spec.jsx src/components/Conversations/ConversationComposer.jsx src/components/CozyAssistantRuntimeProvider.tsx
git commit -m "feat(cozy-search): Restrict default assistant search to selection"
```

---

### Task 9: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Build and mirror into cozy-home**

From the `cozy-libs` repo root: `yarn build` — the rag.localhost dev pipeline (nodemon) mirrors `cozy-search` into cozy-home automatically; never rsync manually.

- [ ] **Step 2: Enable the flag**

In the browser console of the assistant app: `flag('cozy.assistant.attachments.enabled', true)` then reload.

- [ ] **Step 3: Walk the scenarios**

Prerequisite: cozy-drive running from branch `feat/file-picker-reference-option` (or a branch containing it), since the picker's `multiple`/`reference` options live there.

1. Default assistant, new conversation → Drive chip menu shows "All my documents" (selected) + "Choose a folder or files…".
2. Pick a folder with nested subfolders → chip shows the folder name; send a question → the network tab shows `attachmentIDs` in the POST to `/ai/chat/conversations/…`; answers cite only files from the folder.
3. Pick multiple files → chip shows "N items"; payload contains exactly those ids.
4. Reset to "All my documents" → payload has no `attachmentIDs`.
5. Pick a folder with more than 1000 files (or temporarily lower `ATTACHMENTS_MAX_FILES` to e.g. 3 for testing) → chip shows the over-limit label, sending shows the blocking alert, nothing is posted.
6. Trash the picked folder in Drive mid-conversation → chip switches to "Selection unavailable" (realtime), sending is blocked.
7. Switch to a custom assistant → chip behavior unchanged (knowledge base from the wizard).
8. Open a new conversation → back to "All my documents".

- [ ] **Step 4: Restore any test tweaks**

If `ATTACHMENTS_MAX_FILES` was lowered for scenario 5, restore it to 1000 and re-run `yarn test src/components/KnowledgeBase/attachments.spec.js`.
