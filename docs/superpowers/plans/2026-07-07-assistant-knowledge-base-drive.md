# Assistant Knowledge Base (Drive folder) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user attach one real Drive folder to an assistant (create/edit wizard, via Drive's PICK intent), persist it on the assistant doc as `knowledgeBase`, and show it as a composer chip that opens Drive on that folder.

**Architecture:** A new `src/components/KnowledgeBase/` unit in `packages/cozy-search` holds all knowledge-base logic: pure helpers + persistence (`knowledgeBase.js`), the intent-hosting dialog (`FolderPickerDialog.jsx`), the wizard section (`KnowledgeBaseSection.jsx`), a hook resolving the selected assistant's folder (`useSelectedAssistantKnowledgeBase.js`), and the composer chip (`KnowledgeBaseChip.jsx`). Existing wizard/dialog/selector files are modified minimally. The demo `DriveKnowledge` fake tree is removed.

**Tech Stack:** React 18 (JSX, not TS — matches the package), cozy-client (`useQuery`, `Q`, `generateWebLink`), cozy-interapp (intent iframe), cozy-ui components, twake-i18n, Jest + @testing-library/react 12.

**Spec:** `docs/superpowers/specs/2026-07-07-assistant-knowledge-base-drive-design.md`

## Global Constraints

- Working directory for all commands: `/home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel` (git worktree — do NOT cd to the main checkout). Branch: `feat/assistant-knowledge-base-spec`.
- Run tests from `packages/cozy-search`: `yarn test <path-pattern>` (wraps `jest --config=./tests/jest.config.js --passWithNoTests`).
- Commit message titles must not exceed 72 characters.
- Data model (verbatim from spec): `knowledgeBase: [{ doctype: 'io.cozy.files', folderId: '<dir id>' }]` — array, UI enforces a single entry, only the ID stored.
- Drive intent contract (verbatim from spec): request `action: 'PICK'`, `type: 'io.cozy.files'`, data `{ actions: [{ label, action: 'reference', allowFolder: true }] }`; response entry `{ id, name, type: 'directory', doctype: 'io.cozy.files' }`. Cancel resolves `null` (cozy-interapp behavior).
- UI: use cozy-ui components and `u-*` utility classes; no new custom CSS except where noted (the intent iframe container's `minHeight`).
- New user-facing strings go in `src/locales/en.json` AND `src/locales/fr.json` (ru/vi fall back).
- The Drive-side intent `reference` mode is a separate cozy-drive deliverable; all tests here mock the intent boundary.

---

### Task 1: Knowledge-base helpers, persistence, and file query

**Files:**
- Create: `packages/cozy-search/src/components/KnowledgeBase/knowledgeBase.js`
- Create: `packages/cozy-search/src/components/KnowledgeBase/knowledgeBase.spec.js`
- Modify: `packages/cozy-search/src/components/queries.js` (append after `buildAssistantByIdQuery`, line 67)
- Modify: `packages/cozy-search/tests/jest.config.js` (line 12: `testMatch`; add `moduleNameMapper`)
- Create: `packages/cozy-search/tests/styleMock.js`, `packages/cozy-search/tests/fileMock.js`

**Interfaces:**
- Consumes: `FILES_DOCTYPE` (`'io.cozy.files'`) from `../queries`; `Q`, `CozyClient` from cozy-client.
- Produces (used by Tasks 3–5):
  - `makeKnowledgeBaseEntry(pickedFolder: {id: string}) => {doctype: 'io.cozy.files', folderId: string}`
  - `getKnowledgeBaseFolderId(assistant: object|null|undefined) => string|null`
  - `saveKnowledgeBase(client, assistantId: string, knowledgeBase: array) => Promise<void>`
  - `buildFileByIdQuery(fileId: string|null)` query spec (from `queries.js`)

- [ ] **Step 1: Make the jest config able to run component tests**

Two gaps in the current config: `testMatch: ['./**/*.spec.{ts,tsx,js}']` silently skips `.spec.jsx` files (e.g. the existing `useConversation.spec.jsx`), and there is no `moduleNameMapper`, so importing any component that imports `styles.styl` or a `.png` asset crashes (this is why the package only has pure-logic specs today). Tasks 2–5 add `.jsx` component tests.

Create `packages/cozy-search/tests/styleMock.js`:

```js
module.exports = {}
```

Create `packages/cozy-search/tests/fileMock.js`:

```js
module.exports = 'test-file-stub'
```

In `packages/cozy-search/tests/jest.config.js`, replace line 12:

```js
  testMatch: ['./**/*.spec.{ts,tsx,js}'],
```

with:

```js
  testMatch: ['./**/*.spec.{ts,tsx,js,jsx}'],
  moduleNameMapper: {
    '\\.(styl|css)$': '<rootDir>/tests/styleMock.js',
    '\\.(png|jpe?g|gif|svg|webp)$': '<rootDir>/tests/fileMock.js'
  },
```

- [ ] **Step 2: Run the full suite to verify the newly-included jsx specs pass**

Run: `cd packages/cozy-search && yarn test`
Expected: PASS (this now also runs `src/hooks/useConversation.spec.jsx`). If a newly-included pre-existing spec fails, fix that spec (it was written to pass; likely only import drift) — do not revert the config.

- [ ] **Step 3: Write the failing test**

Create `packages/cozy-search/src/components/KnowledgeBase/knowledgeBase.spec.js`:

```js
import {
  makeKnowledgeBaseEntry,
  getKnowledgeBaseFolderId,
  saveKnowledgeBase
} from './knowledgeBase'

describe('makeKnowledgeBaseEntry', () => {
  it('builds an io.cozy.files entry from a picked folder', () => {
    expect(makeKnowledgeBaseEntry({ id: 'folder-1', name: 'HR' })).toEqual({
      doctype: 'io.cozy.files',
      folderId: 'folder-1'
    })
  })
})

describe('getKnowledgeBaseFolderId', () => {
  it('returns the folderId of the io.cozy.files entry', () => {
    const assistant = {
      knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
    }
    expect(getKnowledgeBaseFolderId(assistant)).toBe('folder-1')
  })

  it('ignores entries of other doctypes', () => {
    const assistant = {
      knowledgeBase: [
        { doctype: 'com.linagora.email', mailboxId: 'inbox' },
        { doctype: 'io.cozy.files', folderId: 'folder-2' }
      ]
    }
    expect(getKnowledgeBaseFolderId(assistant)).toBe('folder-2')
  })

  it('returns null when there is no knowledge base', () => {
    expect(getKnowledgeBaseFolderId({})).toBeNull()
    expect(getKnowledgeBaseFolderId(undefined)).toBeNull()
    expect(getKnowledgeBaseFolderId({ knowledgeBase: [] })).toBeNull()
  })
})

describe('saveKnowledgeBase', () => {
  it('refetches the assistant and saves it with the new knowledgeBase', async () => {
    const assistantDoc = {
      _id: 'assistant-1',
      _type: 'io.cozy.ai.chat.assistants',
      name: 'My assistant'
    }
    const client = {
      query: jest.fn().mockResolvedValue({ data: assistantDoc }),
      save: jest.fn().mockResolvedValue({ data: assistantDoc })
    }
    const knowledgeBase = [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]

    await saveKnowledgeBase(client, 'assistant-1', knowledgeBase)

    expect(client.query).toHaveBeenCalledTimes(1)
    expect(client.save).toHaveBeenCalledWith({
      ...assistantDoc,
      knowledgeBase
    })
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/knowledgeBase.spec.js`
Expected: FAIL — `Cannot find module './knowledgeBase'`

- [ ] **Step 5: Write the implementation**

Create `packages/cozy-search/src/components/KnowledgeBase/knowledgeBase.js`:

```js
import { Q } from 'cozy-client'

import { FILES_DOCTYPE } from '../queries'

const ASSISTANTS_DOCTYPE = 'io.cozy.ai.chat.assistants'

export const makeKnowledgeBaseEntry = pickedFolder => ({
  doctype: FILES_DOCTYPE,
  folderId: pickedFolder.id
})

export const getKnowledgeBaseFolderId = assistant =>
  assistant?.knowledgeBase?.find(entry => entry.doctype === FILES_DOCTYPE)
    ?.folderId ?? null

/**
 * Saves the knowledgeBase attribute on an assistant document.
 *
 * cozy-client's createAssistant/editAssistant build the saved doc from a
 * fixed field list, so knowledgeBase must be saved in a follow-up write on
 * the freshly fetched doc (fresh _rev).
 */
export const saveKnowledgeBase = async (client, assistantId, knowledgeBase) => {
  const { data: assistant } = await client.query(
    Q(ASSISTANTS_DOCTYPE).getById(assistantId)
  )
  await client.save({ ...assistant, knowledgeBase })
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/knowledgeBase.spec.js`
Expected: PASS (5 tests)

- [ ] **Step 7: Add `buildFileByIdQuery` to queries.js**

In `packages/cozy-search/src/components/queries.js`, append after `buildAssistantByIdQuery` (after line 67):

```js
export const buildFileByIdQuery = fileId => ({
  definition: Q(FILES_DOCTYPE).getById(fileId),
  options: {
    as: `${FILES_DOCTYPE}/${fileId}`,
    fetchPolicy: defaultFetchPolicy,
    singleDocData: true,
    enabled: !!fileId
  }
})
```

- [ ] **Step 8: Lint and commit**

```bash
cd packages/cozy-search && yarn lint
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git add packages/cozy-search/src/components/KnowledgeBase/ packages/cozy-search/src/components/queries.js packages/cozy-search/tests/jest.config.js
git commit -m "feat(cozy-search): Add knowledge base model helpers"
```

---

### Task 2: FolderPickerDialog — Drive PICK intent host

**Files:**
- Create: `packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.jsx`
- Create: `packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`
- Modify: `packages/cozy-search/package.json` (devDependencies after line 33 `cozy-intent`; peerDependencies after line 68 `cozy-intent`)
- Modify: `packages/cozy-search/src/locales/en.json`, `packages/cozy-search/src/locales/fr.json`

**Interfaces:**
- Consumes: `Intents` default export of `cozy-interapp` (`new Intents({ client })`; `intents.create(action, type, data)` returns a promise with `.start(domElement)`; the start-promise resolves the service's terminate payload — an array of entries — or `null` on cancel, rejects on error, and has `.stop()`).
- Produces (used by Task 3): `<FolderPickerDialog open onClose={() => void} onSelect={folder => void} />` where `folder` is `{ id, name, type: 'directory', doctype: 'io.cozy.files' }`.

- [ ] **Step 1: Add the cozy-interapp dependency**

In `packages/cozy-search/package.json`, add to `devDependencies` (alphabetical, after `"cozy-intent": "^2.31.1",` line 33):

```json
    "cozy-interapp": "^0.17.1",
```

and to `peerDependencies` (after `"cozy-intent": ">=2.26.0",` line 68):

```json
    "cozy-interapp": ">=0.17.1",
```

Then run `yarn install` from the repo root (it resolves to the workspace package `packages/cozy-interapp`).

- [ ] **Step 2: Write the failing test**

Create `packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`:

```jsx
import { render, waitFor } from '@testing-library/react'
import React from 'react'

import FolderPickerDialog from './FolderPickerDialog'

const mockStart = jest.fn()
const mockCreate = jest.fn(() => ({ start: mockStart }))
jest.mock('cozy-interapp', () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)

jest.mock('cozy-client', () => ({
  useClient: () => ({})
}))

const mockShowAlert = jest.fn()
jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: mockShowAlert })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

describe('FolderPickerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = ({ open = true, onClose = jest.fn(), onSelect = jest.fn() }) =>
    render(
      <FolderPickerDialog open={open} onClose={onClose} onSelect={onSelect} />
    )

  it('starts a PICK intent on io.cozy.files with the reference action', async () => {
    mockStart.mockReturnValue(new Promise(() => {}))
    setup({})

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(mockCreate).toHaveBeenCalledWith('PICK', 'io.cozy.files', {
      actions: [
        {
          label: 'assistant_create.from_drive.actions.add',
          action: 'reference',
          allowFolder: true
        }
      ]
    })
    expect(mockStart).toHaveBeenCalledWith(expect.any(HTMLElement))
  })

  it('calls onSelect with the picked folder then closes', async () => {
    const folder = {
      id: 'folder-1',
      name: 'HR',
      type: 'directory',
      doctype: 'io.cozy.files'
    }
    mockStart.mockResolvedValue([folder])
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onSelect).toHaveBeenCalledWith(folder)
  })

  it('closes without selecting when the intent is cancelled', async () => {
    mockStart.mockResolvedValue(null)
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows an alert and closes when the intent errors', async () => {
    mockStart.mockRejectedValue(new Error('boom'))
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(mockShowAlert).toHaveBeenCalledWith({
      message: 'assistant.knowledge_base.picker_error',
      severity: 'error'
    })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does not start an intent when closed', () => {
    setup({ open: false })
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`
Expected: FAIL — `Cannot find module './FolderPickerDialog'`

- [ ] **Step 4: Write the implementation**

Create `packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.jsx`:

```jsx
import React, { useEffect, useRef } from 'react'

import { useClient } from 'cozy-client'
import Intents from 'cozy-interapp'
import Dialog, { DialogContent } from 'cozy-ui/transpiled/react/Dialog'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

/**
 * Hosts the Drive `PICK io.cozy.files` intent (folder `reference` mode)
 * in an iframe dialog, so the surrounding wizard keeps its state.
 */
const FolderPickerDialog = ({ open, onClose, onSelect }) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const intentHostRef = useRef(null)

  useEffect(() => {
    if (!open || !intentHostRef.current) return undefined

    const intents = new Intents({ client })
    const startPromise = intents
      .create('PICK', 'io.cozy.files', {
        actions: [
          {
            label: t('assistant_create.from_drive.actions.add'),
            action: 'reference',
            allowFolder: true
          }
        ]
      })
      .start(intentHostRef.current)

    startPromise
      .then(result => {
        const folder = Array.isArray(result) ? result[0] : result
        if (folder) {
          onSelect(folder)
        }
        onClose()
      })
      .catch(() => {
        showAlert({
          message: t('assistant.knowledge_base.picker_error'),
          severity: 'error'
        })
        onClose()
      })

    return () => startPromise.stop?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent className="u-p-0">
        {/* The intent protocol resizes this element itself (inline styles) */}
        <div ref={intentHostRef} className="u-w-100" style={{ minHeight: 480 }} />
      </DialogContent>
    </Dialog>
  )
}

export default FolderPickerDialog
```

- [ ] **Step 5: Add the error locale key**

In `packages/cozy-search/src/locales/en.json`, inside the `"assistant"` object, add a sibling section (keep JSON valid — check surrounding commas):

```json
"knowledge_base": {
  "picker_error": "Unable to open the Drive folder picker. Please try again."
}
```

In `packages/cozy-search/src/locales/fr.json`, same location:

```json
"knowledge_base": {
  "picker_error": "Impossible d'ouvrir le sélecteur de dossier Drive. Veuillez réessayer."
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/FolderPickerDialog.spec.jsx`
Expected: PASS (5 tests)

Contingency: if cozy-ui's `Dialog` fails to render under jsdom (missing provider context), add to the spec file a passthrough mock instead of fighting it — the dialog chrome is not what these tests verify:

```jsx
jest.mock('cozy-ui/transpiled/react/Dialog', () => {
  const MockDialog = ({ open, children }) => (open ? <div>{children}</div> : null)
  return { __esModule: true, default: MockDialog, DialogContent: ({ children }) => <div>{children}</div> }
})
```

- [ ] **Step 7: Lint and commit**

```bash
cd packages/cozy-search && yarn lint
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git add packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.jsx packages/cozy-search/src/components/KnowledgeBase/FolderPickerDialog.spec.jsx packages/cozy-search/package.json packages/cozy-search/src/locales/en.json packages/cozy-search/src/locales/fr.json yarn.lock
git commit -m "feat(cozy-search): Add Drive folder picker intent dialog"
```

---

### Task 3: KnowledgeBaseSection in the wizard's first step

**Files:**
- Create: `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseSection.jsx`
- Create: `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseSection.spec.jsx`
- Modify: `packages/cozy-search/src/components/CreateAssistantSteps/useAssistantDialog.js:35-43` (formData defaults)
- Modify: `packages/cozy-search/src/components/CreateAssistantSteps/BasicInfoStep.jsx` (render the section)
- Modify: `packages/cozy-search/src/components/CreateAssistantSteps/AssistantDialogContent.jsx:18-27` (pass props)
- Modify: `packages/cozy-search/src/locales/en.json`, `packages/cozy-search/src/locales/fr.json` (remove label)

**Interfaces:**
- Consumes: `FolderPickerDialog` (Task 2), `makeKnowledgeBaseEntry` + `buildFileByIdQuery` (Task 1), existing locale keys `assistant_create.steps.basic_info.knowledge_base`, `.knowledge_base_placeholder`, `.from_drive`, `.from_mail`.
- Produces: `<KnowledgeBaseSection knowledgeBase={array} onChange={entries => void} />`; `formData.knowledgeBase: array` in `useAssistantDialog` (consumed by Task 4); `BasicInfoStep` accepts new props `knowledgeBase`, `onKnowledgeBaseChange`.

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseSection.spec.jsx`:

```jsx
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import KnowledgeBaseSection from './KnowledgeBaseSection'

let mockPickerProps = null
jest.mock('./FolderPickerDialog', () => props => {
  mockPickerProps = props
  return props.open ? <div data-testid="folder-picker" /> : null
})

let mockFileQueryResult = { data: null, fetchStatus: 'loaded' }
jest.mock('cozy-client', () => ({
  useQuery: () => mockFileQueryResult,
  Q: jest.fn(() => ({ getById: jest.fn() })),
  // queries.js calls fetchPolicies.olderThan() at module load
  fetchPolicies: { olderThan: () => jest.fn() }
}))

jest.mock('cozy-flags', () => jest.fn(() => false))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

describe('KnowledgeBaseSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPickerProps = null
    mockFileQueryResult = { data: null, fetchStatus: 'loaded' }
  })

  it('shows the From drive button when no folder is selected', () => {
    render(<KnowledgeBaseSection knowledgeBase={[]} onChange={jest.fn()} />)

    expect(
      screen.getByText('assistant_create.steps.basic_info.from_drive')
    ).toBeTruthy()
  })

  it('opens the picker and propagates the picked folder', () => {
    const onChange = jest.fn()
    render(<KnowledgeBaseSection knowledgeBase={[]} onChange={onChange} />)

    fireEvent.click(
      screen.getByText('assistant_create.steps.basic_info.from_drive')
    )
    expect(screen.getByTestId('folder-picker')).toBeTruthy()

    mockPickerProps.onSelect({ id: 'folder-1', name: 'HR', type: 'directory' })

    expect(onChange).toHaveBeenCalledWith([
      { doctype: 'io.cozy.files', folderId: 'folder-1' }
    ])
  })

  it('shows the selected folder name and no From drive button', () => {
    mockFileQueryResult = {
      data: { _id: 'folder-1', name: 'HR' },
      fetchStatus: 'loaded'
    }
    render(
      <KnowledgeBaseSection
        knowledgeBase={[{ doctype: 'io.cozy.files', folderId: 'folder-1' }]}
        onChange={jest.fn()}
      />
    )

    expect(screen.getByText('HR')).toBeTruthy()
    expect(
      screen.queryByText('assistant_create.steps.basic_info.from_drive')
    ).toBeNull()
  })

  it('removes the folder', () => {
    mockFileQueryResult = {
      data: { _id: 'folder-1', name: 'HR' },
      fetchStatus: 'loaded'
    }
    const onChange = jest.fn()
    render(
      <KnowledgeBaseSection
        knowledgeBase={[{ doctype: 'io.cozy.files', folderId: 'folder-1' }]}
        onChange={onChange}
      />
    )

    fireEvent.click(
      screen.getByLabelText('assistant.knowledge_base.remove')
    )
    expect(onChange).toHaveBeenCalledWith([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/KnowledgeBaseSection.spec.jsx`
Expected: FAIL — `Cannot find module './KnowledgeBaseSection'`

- [ ] **Step 3: Write the implementation**

Create `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseSection.jsx`:

```jsx
import { Icon, Cross } from '@linagora/twake-icons'
import React, { useState } from 'react'

import { useQuery } from 'cozy-client'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import FolderPickerDialog from './FolderPickerDialog'
import { getKnowledgeBaseFolderId, makeKnowledgeBaseEntry } from './knowledgeBase'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { buildFileByIdQuery } from '../queries'

const KnowledgeBaseSection = ({ knowledgeBase = [], onChange }) => {
  const { t } = useI18n()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const folderId = getKnowledgeBaseFolderId({ knowledgeBase })
  const fileQuery = buildFileByIdQuery(folderId)
  const { data: folder } = useQuery(fileQuery.definition, fileQuery.options)

  const showMailButton = flag('cozy.assistant.source-knowledge.enabled')

  const handleSelect = pickedFolder =>
    onChange([makeKnowledgeBaseEntry(pickedFolder)])
  const handleRemove = () => onChange([])

  return (
    <div className="u-mb-1">
      <Typography variant="h6" className="u-mb-half">
        {t('assistant_create.steps.basic_info.knowledge_base')}
      </Typography>
      <Typography variant="body2" className="u-mb-half u-c-text-secondary">
        {t('assistant_create.steps.basic_info.knowledge_base_placeholder')}
      </Typography>
      {folderId ? (
        <Chip
          icon={<img alt="" aria-hidden="true" src={TDrive} width={16} />}
          label={folder?.name ?? '…'}
          deleteIcon={
            <Icon
              icon={Cross}
              size={16}
              aria-label={t('assistant.knowledge_base.remove')}
            />
          }
          onDelete={handleRemove}
          className="u-w-auto u-ph-half"
        />
      ) : (
        <div className="u-flex u-flex-row u-flex-items-center">
          <Button
            variant="secondary"
            size="small"
            startIcon={<img alt="" aria-hidden="true" src={TDrive} width={16} />}
            label={t('assistant_create.steps.basic_info.from_drive')}
            onClick={() => setIsPickerOpen(true)}
          />
          {showMailButton && (
            <Button
              variant="secondary"
              size="small"
              className="u-ml-half"
              startIcon={<img alt="" aria-hidden="true" src={TMail} width={16} />}
              label={t('assistant_create.steps.basic_info.from_mail')}
              disabled
            />
          )}
        </div>
      )}
      {isPickerOpen && (
        <FolderPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

export default KnowledgeBaseSection
```

- [ ] **Step 4: Add the remove locale key**

In `packages/cozy-search/src/locales/en.json`, in the `assistant.knowledge_base` object added in Task 2:

```json
"remove": "Remove folder"
```

In `fr.json`:

```json
"remove": "Retirer le dossier"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/KnowledgeBaseSection.spec.jsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Wire the section into the wizard**

In `packages/cozy-search/src/components/CreateAssistantSteps/useAssistantDialog.js`, add `knowledgeBase: []` to the formData defaults (line 35-43):

```js
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: null,
    model: '',
    baseUrl: '',
    apiKey: '',
    knowledgeBase: [],
    ...initialData
  })
```

In `packages/cozy-search/src/components/CreateAssistantSteps/BasicInfoStep.jsx`: add the import, the two new props, and render the section after the instructions block (after the `</div>` closing the instructions block, line 102):

```jsx
import KnowledgeBaseSection from '../KnowledgeBase/KnowledgeBaseSection'
```

```jsx
const BasicInfoStep = ({
  name,
  description,
  icon,
  knowledgeBase,
  onChange,
  onAvatarChange,
  onKnowledgeBaseChange
}) => {
```

```jsx
      <KnowledgeBaseSection
        knowledgeBase={knowledgeBase}
        onChange={onKnowledgeBaseChange}
      />
```

In `packages/cozy-search/src/components/CreateAssistantSteps/AssistantDialogContent.jsx`, pass the props in the `STEPS.BASIC_INFO` branch (lines 18-27):

```jsx
    case STEPS.BASIC_INFO:
      return (
        <BasicInfoStep
          name={formData.name}
          description={formData.description}
          icon={formData.icon}
          knowledgeBase={formData.knowledgeBase}
          onChange={onChange}
          onAvatarChange={onAvatarChange}
          onKnowledgeBaseChange={onChange('knowledgeBase')}
        />
      )
```

(`onChange('knowledgeBase')` is the existing curried `handleChange` — it accepts a raw value when the argument has no `event.target`, see `useAssistantDialog.js:53-56`.)

- [ ] **Step 7: Run the full suite**

Run: `cd packages/cozy-search && yarn test`
Expected: PASS

- [ ] **Step 8: Lint and commit**

```bash
cd packages/cozy-search && yarn lint
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git add packages/cozy-search/src/components/KnowledgeBase/ packages/cozy-search/src/components/CreateAssistantSteps/ packages/cozy-search/src/locales/
git commit -m "feat(cozy-search): Add knowledge base section to assistant wizard"
```

---

### Task 4: Persist knowledgeBase on create and edit

**Files:**
- Modify: `packages/cozy-search/src/components/Views/CreateAssistantDialog.jsx:65-79` (onSubmit)
- Modify: `packages/cozy-search/src/components/Views/EditAssistantDialog.jsx:52-88` (fetchAssistant) and `:97-109` (onSubmit)
- Create: `packages/cozy-search/src/components/Views/CreateAssistantDialog.spec.jsx`
- Create: `packages/cozy-search/src/components/Views/EditAssistantDialog.spec.jsx`

**Interfaces:**
- Consumes: `saveKnowledgeBase(client, assistantId, knowledgeBase)` (Task 1); `formData.knowledgeBase` (Task 3); existing `createAssistant`/`editAssistant` from `cozy-client/dist/models/assistant`.
- Produces: assistants persisted with the `knowledgeBase` attribute; edit dialog pre-fills `formData.knowledgeBase` from the doc.

- [ ] **Step 1: Write the failing create test**

Create `packages/cozy-search/src/components/Views/CreateAssistantDialog.spec.jsx`:

```jsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import CreateAssistantDialog from './CreateAssistantDialog'

const mockCreateAssistant = jest.fn()
jest.mock('cozy-client/dist/models/assistant', () => ({
  createAssistant: (...args) => mockCreateAssistant(...args)
}))

const mockSaveKnowledgeBase = jest.fn()
jest.mock('../KnowledgeBase/knowledgeBase', () => ({
  saveKnowledgeBase: (...args) => mockSaveKnowledgeBase(...args)
}))

const mockClient = {}
jest.mock('cozy-client', () => ({
  useClient: () => mockClient
}))

jest.mock('../AssistantProvider', () => ({
  useAssistant: () => ({ setSelectedAssistantId: jest.fn() })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: jest.fn() })
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  useBreakpoints: () => ({ isMobile: false })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

jest.mock('../CreateAssistantSteps/AssistantDialogContent', () => () => null)

const mockFormData = {
  name: 'My assistant',
  description: 'prompt',
  icon: null,
  model: 'gpt',
  apiKey: 'key',
  baseUrl: '',
  knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
}
jest.mock('../CreateAssistantSteps/useAssistantDialog', () => ({
  STEPS: { BASIC_INFO: 0, MODEL_SELECTION: 1, API_KEY: 2 },
  useAssistantDialog: () => ({
    step: 2,
    formData: mockFormData,
    selectedProvider: { id: 'openrag' },
    canSubmit: true,
    handleBack: jest.fn(),
    handleNext: async onSubmit => onSubmit(),
    handleChange: () => jest.fn(),
    handleProviderSelection: jest.fn(),
    handleAvatarChange: jest.fn(),
    isNextDisabled: () => false,
    handleChangeModel: jest.fn()
  })
}))

describe('CreateAssistantDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateAssistant.mockResolvedValue({ _id: 'assistant-1' })
  })

  it('saves the knowledge base after creating the assistant', async () => {
    render(<CreateAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_create.buttons.create'))

    await waitFor(() =>
      expect(mockSaveKnowledgeBase).toHaveBeenCalledWith(
        mockClient,
        'assistant-1',
        mockFormData.knowledgeBase
      )
    )
    expect(mockCreateAssistant).toHaveBeenCalled()
  })

  it('skips the knowledge base save when none is selected', async () => {
    mockFormData.knowledgeBase = []
    render(<CreateAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_create.buttons.create'))

    await waitFor(() => expect(mockCreateAssistant).toHaveBeenCalled())
    expect(mockSaveKnowledgeBase).not.toHaveBeenCalled()
    mockFormData.knowledgeBase = [
      { doctype: 'io.cozy.files', folderId: 'folder-1' }
    ]
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/Views/CreateAssistantDialog.spec.jsx`
Expected: FAIL — `saveKnowledgeBase` never called (assertion failure on the first test)

- [ ] **Step 3: Implement the create-side persistence**

In `packages/cozy-search/src/components/Views/CreateAssistantDialog.jsx`, add the import:

```jsx
import { saveKnowledgeBase } from '../KnowledgeBase/knowledgeBase'
```

and replace `onSubmit` (lines 65-79) with:

```jsx
  const onSubmit = async () => {
    const savedAssistant = await createAssistant(client, {
      name: formData.name,
      prompt: formData.description,
      icon: formData.icon,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      providerId: selectedProvider.id
    })
    if (savedAssistant?._id) {
      if (formData.knowledgeBase?.length > 0) {
        await saveKnowledgeBase(
          client,
          savedAssistant._id,
          formData.knowledgeBase
        )
      }
      setSelectedAssistantId(savedAssistant._id)
    }
    showAlert({ message: t('assistant_create.success'), severity: 'success' })
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/Views/CreateAssistantDialog.spec.jsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Write the failing edit test**

Create `packages/cozy-search/src/components/Views/EditAssistantDialog.spec.jsx`:

```jsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import EditAssistantDialog from './EditAssistantDialog'

const mockEditAssistant = jest.fn()
jest.mock('cozy-client/dist/models/assistant', () => ({
  editAssistant: (...args) => mockEditAssistant(...args)
}))

const mockSaveKnowledgeBase = jest.fn()
jest.mock('../KnowledgeBase/knowledgeBase', () => ({
  saveKnowledgeBase: (...args) => mockSaveKnowledgeBase(...args)
}))

const mockAssistantDoc = {
  _id: 'assistant-1',
  name: 'My assistant',
  prompt: 'prompt',
  icon: null,
  knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }],
  relationships: {
    provider: { data: { metadata: { providerId: 'openrag' } } }
  }
}
const mockClient = {
  query: jest.fn().mockResolvedValue({
    data: mockAssistantDoc,
    included: [{ auth: { login: 'model' }, data: { baseUrl: '' } }]
  })
}
jest.mock('cozy-client', () => ({
  useClient: () => mockClient,
  Q: () => ({ getById: () => ({ include: () => ({}) }) })
}))

jest.mock('../AssistantProvider', () => ({
  useAssistant: () => ({
    assistantIdInAction: 'assistant-1',
    setSelectedAssistantId: jest.fn()
  })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: jest.fn() })
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  useBreakpoints: () => ({ isMobile: false })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

jest.mock('../CreateAssistantSteps/AssistantDialogContent', () => () => null)

const mockSetFormData = jest.fn()
const mockFormData = {
  name: 'My assistant',
  description: 'prompt',
  icon: null,
  model: 'model',
  apiKey: '',
  baseUrl: '',
  encryptedApiKey: 'enc',
  knowledgeBase: []
}
jest.mock('../CreateAssistantSteps/useAssistantDialog', () => ({
  STEPS: { BASIC_INFO: 0, MODEL_SELECTION: 1, API_KEY: 2 },
  useAssistantDialog: () => ({
    step: 2,
    formData: mockFormData,
    selectedProvider: { id: 'openrag' },
    canSubmit: true,
    setFormData: mockSetFormData,
    setSelectedProvider: jest.fn(),
    handleBack: jest.fn(),
    handleNext: async onSubmit => onSubmit(),
    handleChange: () => jest.fn(),
    handleProviderSelection: jest.fn(),
    handleAvatarChange: jest.fn(),
    isNextDisabled: () => false,
    handleChangeModel: jest.fn()
  })
}))

describe('EditAssistantDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('pre-fills formData.knowledgeBase from the assistant doc', async () => {
    render(<EditAssistantDialog open onClose={jest.fn()} />)

    await waitFor(() =>
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
        })
      )
    )
  })

  it('always saves the knowledge base on submit (supports removal)', async () => {
    render(<EditAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_edit.buttons.edit'))

    await waitFor(() =>
      expect(mockSaveKnowledgeBase).toHaveBeenCalledWith(
        mockClient,
        'assistant-1',
        mockFormData.knowledgeBase
      )
    )
    expect(mockEditAssistant).toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/Views/EditAssistantDialog.spec.jsx`
Expected: FAIL — `setFormData` not called with `knowledgeBase` (first test), `saveKnowledgeBase` never called (second test)

- [ ] **Step 7: Implement the edit-side persistence**

In `packages/cozy-search/src/components/Views/EditAssistantDialog.jsx`, add the import:

```jsx
import { saveKnowledgeBase } from '../KnowledgeBase/knowledgeBase'
```

In `fetchAssistant` (lines 65-74), add `knowledgeBase` to the `setFormData` call:

```jsx
      setFormData({
        name: assistant.name || '',
        description: assistant.prompt || '',
        icon: assistant.icon || '',
        model: provider?.auth?.login || '',
        baseUrl: provider?.data?.baseUrl || '',
        apiKey: provider?.auth?.apiKey || '',
        encryptedApiKey: provider?.auth?.credentials_encrypted || '',
        providerId,
        knowledgeBase: assistant.knowledgeBase || []
      })
```

In `onSubmit` (lines 97-109), save the knowledge base after `editAssistant` (always, so removal — empty array — is persisted too):

```jsx
  const onSubmit = async () => {
    await editAssistant(client, assistantIdInAction, {
      name: formData.name,
      prompt: formData.description,
      icon: formData.icon,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      providerId: selectedProvider.id
    })
    await saveKnowledgeBase(
      client,
      assistantIdInAction,
      formData.knowledgeBase || []
    )
    setSelectedAssistantId(assistantIdInAction)
    showAlert({ message: t('assistant_edit.success'), severity: 'success' })
  }
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd packages/cozy-search && yarn test src/components/Views/`
Expected: PASS (4 tests across both spec files)

- [ ] **Step 9: Lint and commit**

```bash
cd packages/cozy-search && yarn lint
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git add packages/cozy-search/src/components/Views/
git commit -m "feat(cozy-search): Persist assistant knowledge base on create/edit"
```

---

### Task 5: Composer chip + demo Drive tree removal

**Files:**
- Create: `packages/cozy-search/src/components/KnowledgeBase/useSelectedAssistantKnowledgeBase.js`
- Create: `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseChip.jsx`
- Create: `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseChip.spec.jsx`
- Modify: `packages/cozy-search/src/components/TwakeKnowledges/TwakeKnowledgeSelector.jsx`
- Modify: `packages/cozy-search/src/components/TwakeKnowledges/TwakeKnowledgePanel.jsx` (drop the `drive` entry from `PANEL_CONFIG` + its import)
- Modify: `packages/cozy-search/src/components/AssistantProvider.jsx:29-33` (drop `drive` key)
- Delete: `packages/cozy-search/src/components/TwakeKnowledges/DriveKnowledge.jsx`
- Modify: `packages/cozy-search/src/locales/en.json`, `packages/cozy-search/src/locales/fr.json` (unavailable label)

**Interfaces:**
- Consumes: `getKnowledgeBaseFolderId`, `buildFileByIdQuery` (Task 1), `buildAssistantByIdQuery` (existing, `queries.js:58`), `DEFAULT_ASSISTANT` (`../constants`), `generateWebLink` + `useClient` + `useQuery` (cozy-client), `useAssistant()` (existing context).
- Produces:
  - `useSelectedAssistantKnowledgeBase() => { folderId: string|null, folder: object|null, isUnavailable: boolean }`
  - `<KnowledgeBaseChip folderId folder isUnavailable isLast />` (presentational)

- [ ] **Step 1: Write the failing chip test**

Create `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseChip.spec.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import React from 'react'

import KnowledgeBaseChip from './KnowledgeBaseChip'

jest.mock('cozy-client', () => ({
  useClient: () => ({
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }),
  generateWebLink: jest.fn(
    ({ hash }) => `https://claude-drive.mycozy.cloud/#${hash}`
  )
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

describe('KnowledgeBaseChip', () => {
  it('links to the folder in Drive in a new tab', () => {
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={{ _id: 'folder-1', name: 'HR' }}
        isUnavailable={false}
        isLast
      />
    )

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe(
      'https://claude-drive.mycozy.cloud/#/folder/folder-1'
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.getByText('HR')).toBeTruthy()
  })

  it('shows the unavailable state without a link', () => {
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={null}
        isUnavailable
        isLast
      />
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.getByText('assistant.knowledge_base.unavailable')
    ).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/KnowledgeBaseChip.spec.jsx`
Expected: FAIL — `Cannot find module './KnowledgeBaseChip'`

- [ ] **Step 3: Write the chip and the hook**

Create `packages/cozy-search/src/components/KnowledgeBase/KnowledgeBaseChip.jsx`:

```jsx
import cx from 'classnames'
import React from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { useI18n } from 'twake-i18n'

import TDrive from '../../assets/tdrive.png'

/**
 * Composer chip showing the selected assistant's knowledge-base folder.
 * Clicking opens the real Drive app on that folder in a new tab — that is
 * where file management (rename, move, upload) happens.
 */
const KnowledgeBaseChip = ({ folderId, folder, isUnavailable, isLast }) => {
  const { t } = useI18n()
  const client = useClient()

  const chipIcon = (
    <img alt="" aria-hidden="true" src={TDrive} width={16} className="u-m-0" />
  )

  if (isUnavailable) {
    return (
      <Chip
        icon={chipIcon}
        label={t('assistant.knowledge_base.unavailable')}
        disabled
        className={cx('u-w-auto u-ph-half u-mr-0', { 'u-mr-half': !isLast })}
      />
    )
  }

  const folderUrl = generateWebLink({
    slug: 'drive',
    cozyUrl: client?.getStackClient().uri,
    subDomainType: client?.getInstanceOptions().subdomain,
    hash: `/folder/${folderId}`
  })

  return (
    <Chip
      icon={chipIcon}
      label={folder?.name ?? '…'}
      clickable
      component="a"
      href={folderUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('assistant.knowledge_base.open_folder')}
      className={cx('u-w-auto u-ph-half u-mr-0', { 'u-mr-half': !isLast })}
    />
  )
}

export default KnowledgeBaseChip
```

Create `packages/cozy-search/src/components/KnowledgeBase/useSelectedAssistantKnowledgeBase.js`:

```js
import { useQuery } from 'cozy-client'

import { getKnowledgeBaseFolderId } from './knowledgeBase'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantByIdQuery, buildFileByIdQuery } from '../queries'

/**
 * Resolves the selected assistant's knowledge-base folder, live from
 * io.cozy.files (renames in Drive are reflected; deletion is detected).
 */
export const useSelectedAssistantKnowledgeBase = () => {
  const { selectedAssistantId } = useAssistant()
  const realAssistantId =
    selectedAssistantId !== DEFAULT_ASSISTANT._id ? selectedAssistantId : null

  const assistantQuery = buildAssistantByIdQuery(realAssistantId)
  const { data: assistant } = useQuery(
    assistantQuery.definition,
    assistantQuery.options
  )

  const folderId = getKnowledgeBaseFolderId(assistant)
  const fileQuery = buildFileByIdQuery(folderId)
  const { data: folder, fetchStatus } = useQuery(
    fileQuery.definition,
    fileQuery.options
  )

  return {
    folderId,
    folder: folder ?? null,
    isUnavailable:
      !!folderId && (fetchStatus === 'failed' || !!folder?.trashed)
  }
}
```

- [ ] **Step 4: Add the locale keys**

In `packages/cozy-search/src/locales/en.json`, `assistant.knowledge_base`:

```json
"unavailable": "Folder unavailable",
"open_folder": "Open folder in Drive"
```

In `fr.json`:

```json
"unavailable": "Dossier indisponible",
"open_folder": "Ouvrir le dossier dans Drive"
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/KnowledgeBase/KnowledgeBaseChip.spec.jsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Rewire TwakeKnowledgeSelector and remove the demo Drive tree**

Replace `packages/cozy-search/src/components/TwakeKnowledges/TwakeKnowledgeSelector.jsx` content with:

```jsx
import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import TwakeKnowledgeChip from './TwakeKnowledgeChip'
import WebSearchChip from './WebSearchChip'
import TChat from '../../assets/tchat.png'
import TMail from '../../assets/tmail.png'
import KnowledgeBaseChip from '../KnowledgeBase/KnowledgeBaseChip'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

const TwakeKnowledgeSelector = ({
  className,
  onSelectTwakeKnowledge,
  websearchEnabled,
  onToggleWebsearch
}) => {
  const { t } = useI18n()
  const { folderId, folder, isUnavailable } =
    useSelectedAssistantKnowledgeBase()

  const websearchEnabledFlag = flag('cozy.assistant.websearch.enabled')
  const sourceKnowledgeEnabledFlag = flag(
    'cozy.assistant.source-knowledge.enabled'
  )
  const hasKnowledgeBase = !!folderId

  const twakeKnowledges = [
    {
      id: 'chat',
      label: t('assistant.twake_knowledges.chat'),
      display: flag('cozy.assistant.source-knowledge.chat.enabled'),
      icon: TChat
    },
    {
      id: 'mail',
      label: t('assistant.twake_knowledges.mail'),
      display: true,
      icon: TMail
    }
  ].filter(twakeKnowledge => twakeKnowledge.display)

  if (
    !websearchEnabledFlag &&
    !sourceKnowledgeEnabledFlag &&
    !hasKnowledgeBase
  ) {
    return null
  }

  return (
    <div
      className={cx(
        'u-flex u-flex-row u-flex-wrap u-flex-items-center u-flex-justify-end',
        className
      )}
    >
      <Typography className="u-mr-half u-fz-tiny u-coolGrey">
        {t('assistant.twake_knowledges.search_in')}
      </Typography>
      {websearchEnabledFlag && (
        <WebSearchChip
          websearchEnabled={websearchEnabled}
          onToggleWebsearch={onToggleWebsearch}
        />
      )}
      {hasKnowledgeBase && (
        <KnowledgeBaseChip
          folderId={folderId}
          folder={folder}
          isUnavailable={isUnavailable}
          isLast={!sourceKnowledgeEnabledFlag || twakeKnowledges.length === 0}
        />
      )}
      {sourceKnowledgeEnabledFlag &&
        twakeKnowledges.map((twakeKnowledge, index) => (
          <TwakeKnowledgeChip
            key={twakeKnowledge.id}
            twakeKnowledge={twakeKnowledge}
            isLast={index === twakeKnowledges.length - 1}
            onSelect={onSelectTwakeKnowledge}
          />
        ))}
    </div>
  )
}

export default TwakeKnowledgeSelector
```

Then:
- Delete `packages/cozy-search/src/components/TwakeKnowledges/DriveKnowledge.jsx`.
- In `packages/cozy-search/src/components/TwakeKnowledges/TwakeKnowledgePanel.jsx`: remove the `DriveKnowledge` import and the `drive` entry from `PANEL_CONFIG` (the object mapping `drive`/`mail`/`chat`, lines ~23-45).
- In `packages/cozy-search/src/components/AssistantProvider.jsx` lines 29-33, remove the `drive` key:

```js
  const [selectedTwakeKnowledge, setSelectedTwakeKnowledge] = useState({
    mail: [],
    chat: []
  })
```

- Verify nothing else reads `selectedTwakeKnowledge.drive`:

Run: `grep -rn "selectedTwakeKnowledge" packages/cozy-search/src | grep -v spec`
Expected: only `AssistantProvider.jsx`, `TwakeKnowledgePanel.jsx`, `TwakeKnowledgeChip.jsx` — none referencing `drive`. Also run `grep -rn "DriveKnowledge" packages/cozy-search/src` — expected: no results.

- [ ] **Step 7: Run the full suite**

Run: `cd packages/cozy-search && yarn test`
Expected: PASS

- [ ] **Step 8: Lint and commit**

```bash
cd packages/cozy-search && yarn lint
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git add -A packages/cozy-search/src
git commit -m "feat(cozy-search): Show knowledge base chip, drop demo Drive tree"
```

---

### Task 6: Full verification pass

**Files:**
- No new files; fixes only if verification fails.

**Interfaces:**
- Consumes: everything above.
- Produces: green build, lint, and test suite for the whole package.

- [ ] **Step 1: Full test suite**

Run: `cd packages/cozy-search && yarn test`
Expected: PASS, all spec files including the pre-existing ones.

- [ ] **Step 2: Type/build check**

Run: `cd packages/cozy-search && yarn build`
Expected: exits 0 (babel + tsc build). Fix any import errors it surfaces.

- [ ] **Step 3: Lint**

Run: `cd packages/cozy-search && yarn lint`
Expected: no errors.

- [ ] **Step 4: Commit any fixes**

```bash
cd /home/paul/dev/cozy/apps/cozy-libs/.claude/worktrees/abundant-crunching-squirrel
git status --short  # only commit if fixes were needed
git add -A packages/cozy-search && git commit -m "fix(cozy-search): Address verification pass findings"
```

---

## Out of scope (tracked in the spec)

- **cozy-drive**: the `reference` return mode on the `PICK` intent (`/home/paul/dev/cozy/apps/cozy-drive`, `src/modules/services/components/Picker.jsx` + `FilePicker/`). Until it ships, the picker dialog opens Drive's current picker whose confirm actions return links; end-to-end folder selection needs that Drive change.
- **cozy-client**: optional follow-up PR to accept `knowledgeBase` in `createAssistant`/`editAssistant` (the `saveKnowledgeBase` helper makes this unnecessary short-term).
- **Backend**: reads `knowledgeBase` off the assistant doc; no chat-request change.
- **Flagship verification**: intent iframe + new-tab behavior inside the native webview.
