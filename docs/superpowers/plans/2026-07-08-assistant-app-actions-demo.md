# Assistant App Actions (Client-Side Demo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the assistant chat propose confirm-first action cards ("create a note", "create a calendar event") detected by regex, parameterized by a direct LLM side-call, executed client-side on click.

**Architecture:** A new `src/components/actions/` module in `packages/cozy-search` holds a capability registry (regex matching + prompt fragments), a JSON extractor, executors, and card UIs. `CozyRealtimeChatAdapter.run` branches on regex match: it POSTs to cozy-stack's existing `/ai/v1/chat/completions` proxy (omitting `model` ⇒ openRAG direct-LLM mode, no RAG), parses `{sentence, action, params}`, and yields a `text` + `tool-call` message; cards registered via assistant-ui's `makeAssistantToolUI` execute on click. Every failure falls back to the untouched normal chat flow. No backend change; action exchanges are not persisted (vanish on reload — accepted, per spec).

**Tech Stack:** TypeScript (strict), React 18, `@assistant-ui/react` 0.12.5, cozy-client (peer dep), cozy-ui (MUI v4), jest 30 + @testing-library/react 12.

**Spec:** `docs/superpowers/specs/2026-07-08-assistant-app-actions-demo-design.md`

## Global Constraints

- Working directory for all commands: `packages/cozy-search` (inside the repo/worktree root).
- Test command: `yarn test <path-to-spec-file>` (uses `tests/jest.config.js`). Full suite: `yarn test`.
- Lint: `yarn lint` (from `packages/cozy-search`; it cds to repo root itself).
- Commit message titles MUST NOT exceed 72 characters. Use the repo convention: `feat(cozy-search): …` / `test(cozy-search): …`.
- TypeScript is `strict: true`. Annotate function return types explicitly (repo eslint enforces it; follow the style of `CozyRealtimeChatAdapter.ts`).
- No new npm dependencies. cozy-client, cozy-ui, twake-i18n are peer deps already used.
- cozy-ui rules: import from `cozy-ui/transpiled/react/<Component>`; NO custom CSS — use `u-*` utility classes only (`u-p-1`, `u-mt-half`, `u-stack-half`, `u-fw-bold`, …). Do not create any `.styl` file.
- All new files live in `packages/cozy-search/src/components/actions/` (this directory does not exist yet; it is distinct from the existing `src/actions/` file-menu actions — do not touch those).
- Untyped modules get an `any`-based declaration in `src/types.d.ts` (existing pattern, see `cozy-client/dist/models/contact` there).

---

### Task 1: Capability registry with regex intent matching

**Files:**
- Create: `packages/cozy-search/src/components/actions/capabilities.ts`
- Test: `packages/cozy-search/src/components/actions/capabilities.spec.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `CapabilityId = 'create_note' | 'create_event'`; `interface Capability { id: CapabilityId; match: (text: string) => boolean; paramsPrompt: string; requiredParams: string[] }`; `CAPABILITIES: Capability[]`; `matchCapability(text: string): Capability | null`. Later tasks import all of these from `./capabilities`.

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/actions/capabilities.spec.ts`:

```ts
import { matchCapability } from './capabilities'

describe('matchCapability', () => {
  it.each([
    'Create a note summarizing this discussion',
    'write a note about the project',
    'Crée une note avec un résumé de cette discussion',
    'Rédige une note sur le budget'
  ])('detects create_note in "%s"', text => {
    expect(matchCapability(text)?.id).toBe('create_note')
  })

  it.each([
    'Schedule a meeting with Alice on Friday at 10am',
    'create an event for tomorrow',
    'Crée une réunion avec Bob vendredi',
    'Planifie une visio avec Alice demain',
    'ajoute un rendez-vous lundi à 9h'
  ])('detects create_event in "%s"', text => {
    expect(matchCapability(text)?.id).toBe('create_event')
  })

  it.each([
    'What is the weather like today?',
    'Summarize this document',
    'Quelle est ma dernière facture ?',
    'note', // object without a verb
    'meeting' // object without a verb
  ])('returns null for "%s"', text => {
    expect(matchCapability(text)).toBeNull()
  })

  it('prefers create_note when both objects appear', () => {
    // "note" is the more specific ask even if "meeting" is mentioned
    expect(matchCapability('Create a note about the meeting')?.id).toBe(
      'create_note'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/capabilities.spec.ts`
Expected: FAIL — `Cannot find module './capabilities'`.

- [ ] **Step 3: Write the implementation**

Create `packages/cozy-search/src/components/actions/capabilities.ts`:

```ts
/**
 * Capability registry for assistant app actions (demo).
 *
 * Intent detection is deliberately regex-based (see the design spec):
 * false positives are cheap because the LLM side-call must still return
 * valid JSON and the user must still click the card to execute.
 */

export type CapabilityId = 'create_note' | 'create_event'

export interface Capability {
  id: CapabilityId
  match: (text: string) => boolean
  /** JSON-schema fragment appended to the side-call system prompt */
  paramsPrompt: string
  /** Params that must be non-empty strings for a proposal to be valid */
  requiredParams: string[]
}

const NOTE_VERB = /(cr[ée]e|cr[ée]er|r[ée]dige|[ée]cris|fais|create|make|write|take)/i
const NOTE_OBJECT = /\bnotes?\b/i
const EVENT_VERB =
  /(cr[ée]e|cr[ée]er|planifie|organise|ajoute|programme|create|schedule|plan|add|set\s?up|book)/i
const EVENT_OBJECT =
  /(r[ée]union|rendez[- ]vous|\brdv\b|meeting|\bevents?\b|[ée]v[ée]nement|visio|\bcall\b)/i

// Order matters: create_note first, "note" is the more specific object
// (e.g. "create a note about the meeting" must map to create_note).
export const CAPABILITIES: Capability[] = [
  {
    id: 'create_note',
    match: (text: string): boolean =>
      NOTE_VERB.test(text) && NOTE_OBJECT.test(text),
    paramsPrompt:
      'For action "create_note", "params" is {"title": string, "content": string}. ' +
      '"content" is the note body in simple Markdown: use "#"/"##" headings, ' +
      'plain paragraphs and "- " bullet lists only. If the user asks to ' +
      'summarize the discussion, write a summary of the conversation so far.',
    requiredParams: ['title', 'content']
  },
  {
    id: 'create_event',
    match: (text: string): boolean =>
      EVENT_VERB.test(text) && EVENT_OBJECT.test(text),
    paramsPrompt:
      'For action "create_event", "params" is {"title": string, "start": string, ' +
      '"end": string, "attendee": string}. "start" and "end" are ISO 8601 ' +
      'datetimes like "2026-07-10T10:00:00"; if the user gives no end time, set ' +
      '"end" one hour after "start". "attendee" is the invited person\'s name ' +
      'or email, or "" if none.',
    requiredParams: ['title', 'start']
  }
]

export const matchCapability = (text: string): Capability | null =>
  CAPABILITIES.find(capability => capability.match(text)) ?? null
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/capabilities.spec.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-search/src/components/actions/capabilities.ts packages/cozy-search/src/components/actions/capabilities.spec.ts
git commit -m "feat(cozy-search): Add app action capability registry"
```

---

### Task 2: JSON proposal extractor

**Files:**
- Create: `packages/cozy-search/src/components/actions/extractActionJson.ts`
- Test: `packages/cozy-search/src/components/actions/extractActionJson.spec.ts`

**Interfaces:**
- Consumes: `Capability`, `CapabilityId` from `./capabilities` (Task 1).
- Produces: `interface ActionProposal { sentence: string; action: CapabilityId; params: Record<string, string> }`; `extractActionJson(raw: string, capability: Capability): ActionProposal | null`. Used by Task 5 (`fetchActionProposal`).

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/actions/extractActionJson.spec.ts`:

```ts
import { CAPABILITIES } from './capabilities'
import { extractActionJson } from './extractActionJson'

const createNote = CAPABILITIES[0] // id: create_note

const valid = {
  sentence: 'Sure — click the card to create the note.',
  action: 'create_note',
  params: { title: 'Summary', content: '# Points\n- one' }
}

describe('extractActionJson', () => {
  it('parses a bare JSON object', () => {
    expect(extractActionJson(JSON.stringify(valid), createNote)).toEqual(valid)
  })

  it('parses JSON inside a fenced code block', () => {
    const raw = 'Here you go:\n```json\n' + JSON.stringify(valid) + '\n```'
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })

  it('parses JSON wrapped in prose', () => {
    const raw = 'Of course! ' + JSON.stringify(valid) + ' Let me know.'
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })

  it('rejects a mismatched action id', () => {
    const raw = JSON.stringify({ ...valid, action: 'create_event' })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects missing required params', () => {
    const raw = JSON.stringify({ ...valid, params: { title: 'Summary' } })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects empty required params', () => {
    const raw = JSON.stringify({
      ...valid,
      params: { title: ' ', content: 'x' }
    })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('rejects an empty sentence', () => {
    const raw = JSON.stringify({ ...valid, sentence: '' })
    expect(extractActionJson(raw, createNote)).toBeNull()
  })

  it('returns null on garbage', () => {
    expect(extractActionJson('I cannot do that.', createNote)).toBeNull()
  })

  it('drops non-string extra params', () => {
    const raw = JSON.stringify({
      ...valid,
      params: { ...valid.params, count: 3 }
    })
    expect(extractActionJson(raw, createNote)).toEqual(valid)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/extractActionJson.spec.ts`
Expected: FAIL — `Cannot find module './extractActionJson'`.

- [ ] **Step 3: Write the implementation**

Create `packages/cozy-search/src/components/actions/extractActionJson.ts`:

```ts
import { Capability, CapabilityId } from './capabilities'

export interface ActionProposal {
  sentence: string
  action: CapabilityId
  params: Record<string, string>
}

const FENCED_RE = /```(?:json)?\s*([\s\S]*?)```/

/** Candidate substrings to try JSON.parse on, most specific first. */
const candidates = (raw: string): string[] => {
  const list = [raw.trim()]
  const fenced = FENCED_RE.exec(raw)
  if (fenced) {
    list.push(fenced[1].trim())
  }
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    list.push(raw.slice(start, end + 1))
  }
  return list
}

const isValid = (
  value: unknown,
  capability: Capability
): value is { sentence: string; action: CapabilityId; params: object } => {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.sentence !== 'string' || obj.sentence.trim() === '')
    return false
  if (obj.action !== capability.id) return false
  if (typeof obj.params !== 'object' || obj.params === null) return false
  const params = obj.params as Record<string, unknown>
  return capability.requiredParams.every(
    key =>
      typeof params[key] === 'string' && (params[key] as string).trim() !== ''
  )
}

export const extractActionJson = (
  raw: string,
  capability: Capability
): ActionProposal | null => {
  for (const candidate of candidates(raw)) {
    let parsed: unknown
    try {
      parsed = JSON.parse(candidate)
    } catch {
      continue
    }
    if (isValid(parsed, capability)) {
      return {
        sentence: parsed.sentence,
        action: parsed.action,
        params: Object.fromEntries(
          Object.entries(parsed.params).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
      }
    }
  }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/extractActionJson.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-search/src/components/actions/extractActionJson.ts packages/cozy-search/src/components/actions/extractActionJson.spec.ts
git commit -m "feat(cozy-search): Add action proposal JSON extractor"
```

---

### Task 3: Markdown → ProseMirror converter + notes schema

**Files:**
- Create: `packages/cozy-search/src/components/actions/markdownToProseMirror.ts`
- Test: `packages/cozy-search/src/components/actions/markdownToProseMirror.spec.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces: `NOTES_SCHEMA` (plain object, the standard cozy-notes ProseMirror schema spec) and `markdownToProseMirror(markdown: string): PmNode` returning `{ type: 'doc', content: [...] }`. Used by Task 4 (`executeAction`).

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/actions/markdownToProseMirror.spec.ts`:

```ts
import { markdownToProseMirror } from './markdownToProseMirror'

describe('markdownToProseMirror', () => {
  it('converts headings', () => {
    expect(markdownToProseMirror('# Title\n## Sub')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Sub' }]
        }
      ]
    })
  })

  it('joins consecutive lines into one paragraph, splits on blank lines', () => {
    expect(markdownToProseMirror('line one\nline two\n\nsecond para')).toEqual(
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'line one line two' }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'second para' }]
          }
        ]
      }
    )
  })

  it('groups bullet lines into one bullet_list', () => {
    expect(markdownToProseMirror('- a\n- b')).toEqual({
      type: 'doc',
      content: [
        {
          type: 'bullet_list',
          content: [
            {
              type: 'list_item',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'a' }] }
              ]
            },
            {
              type: 'list_item',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'b' }] }
              ]
            }
          ]
        }
      ]
    })
  })

  it('handles mixed content in order', () => {
    const doc = markdownToProseMirror('# T\npara\n- x')
    expect(doc.content?.map(n => n.type)).toEqual([
      'heading',
      'paragraph',
      'bullet_list'
    ])
  })

  it('returns a single empty paragraph for empty input', () => {
    expect(markdownToProseMirror('')).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph' }]
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/markdownToProseMirror.spec.ts`
Expected: FAIL — `Cannot find module './markdownToProseMirror'`.

- [ ] **Step 3: Write the implementation**

Create `packages/cozy-search/src/components/actions/markdownToProseMirror.ts`:

```ts
/**
 * Minimal Markdown → ProseMirror doc conversion for note creation.
 * Supports exactly what the side-call prompt asks the LLM to emit:
 * "#"/"##"… headings, plain paragraphs, "- " bullet lists.
 * Anything else degrades to plain paragraph text.
 */

export interface PmNode {
  type: string
  attrs?: Record<string, unknown>
  content?: PmNode[]
  text?: string
}

/**
 * The standard cozy-notes ProseMirror schema spec (OrderedMaps as arrays),
 * as documented in cozy-stack docs/notes.md. Required by POST /notes.
 */
export const NOTES_SCHEMA = {
  nodes: [
    ['doc', { content: 'block+' }],
    ['paragraph', { content: 'inline*', group: 'block' }],
    ['blockquote', { content: 'block+', group: 'block' }],
    ['horizontal_rule', { group: 'block' }],
    [
      'heading',
      {
        content: 'inline*',
        group: 'block',
        attrs: { level: { default: 1 } }
      }
    ],
    ['code_block', { content: 'text*', marks: '', group: 'block' }],
    ['text', { group: 'inline' }],
    [
      'image',
      {
        group: 'inline',
        inline: true,
        attrs: { alt: {}, src: {}, title: {} }
      }
    ],
    ['hard_break', { group: 'inline', inline: true }],
    [
      'ordered_list',
      {
        content: 'list_item+',
        group: 'block',
        attrs: { order: { default: 1 } }
      }
    ],
    ['bullet_list', { content: 'list_item+', group: 'block' }],
    ['list_item', { content: 'paragraph block*' }]
  ],
  marks: [
    ['link', { attrs: { href: {}, title: {} }, inclusive: false }],
    ['em', {}],
    ['strong', {}],
    ['code', {}]
  ],
  topNode: 'doc'
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/
const BULLET_RE = /^[-*]\s+(.+)$/

export const markdownToProseMirror = (markdown: string): PmNode => {
  const nodes: PmNode[] = []
  let paragraphLines: string[] = []
  let bulletItems: string[] = []

  const flushParagraph = (): void => {
    if (paragraphLines.length > 0) {
      nodes.push({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraphLines.join(' ') }]
      })
      paragraphLines = []
    }
  }

  const flushBullets = (): void => {
    if (bulletItems.length > 0) {
      nodes.push({
        type: 'bullet_list',
        content: bulletItems.map(item => ({
          type: 'list_item',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: item }]
            }
          ]
        }))
      })
      bulletItems = []
    }
  }

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '') {
      flushParagraph()
      flushBullets()
      continue
    }
    const heading = HEADING_RE.exec(line)
    if (heading) {
      flushParagraph()
      flushBullets()
      nodes.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: [{ type: 'text', text: heading[2] }]
      })
      continue
    }
    const bullet = BULLET_RE.exec(line)
    if (bullet) {
      flushParagraph()
      bulletItems.push(bullet[1])
      continue
    }
    flushBullets()
    paragraphLines.push(line)
  }
  flushParagraph()
  flushBullets()

  if (nodes.length === 0) {
    // ProseMirror forbids empty text nodes; an empty doc is one bare paragraph
    nodes.push({ type: 'paragraph' })
  }
  return { type: 'doc', content: nodes }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/markdownToProseMirror.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-search/src/components/actions/markdownToProseMirror.ts packages/cozy-search/src/components/actions/markdownToProseMirror.spec.ts
git commit -m "feat(cozy-search): Add markdown to ProseMirror note converter"
```

---

### Task 4: Action executors

**Files:**
- Create: `packages/cozy-search/src/components/actions/executeAction.ts`
- Modify: `packages/cozy-search/src/types.d.ts` (add one module declaration at the end)
- Test: `packages/cozy-search/src/components/actions/executeAction.spec.ts`

**Interfaces:**
- Consumes: `CapabilityId` (Task 1); `markdownToProseMirror`, `NOTES_SCHEMA` (Task 3); `generateWebLink` from `cozy-client`; `fetchURL` from `cozy-client/dist/models/note`.
- Produces: `interface ExecuteResult { url?: string }`; `executeAction(client: ActionClient, id: CapabilityId, params: Record<string, string>): Promise<ExecuteResult>` where `ActionClient` is the exported minimal client type `{ stackClient: { fetchJSON }, getStackClient(): { uri: string }, getInstanceOptions(): { subdomain: string } }`. Used by Task 6 (tool UIs).

- [ ] **Step 1: Add the module declaration for the untyped note model**

Append to `packages/cozy-search/src/types.d.ts` (after the existing `cozy-client/dist/models/contact` block):

```ts
declare module 'cozy-client/dist/models/note' {
  export function fetchURL(client: any, file: { id: string }): Promise<string>
}
```

- [ ] **Step 2: Write the failing test**

Create `packages/cozy-search/src/components/actions/executeAction.spec.ts`:

```ts
import { executeAction } from './executeAction'

jest.mock('cozy-client', () => ({
  generateWebLink: jest.fn(
    ({ slug, searchParams }) =>
      `https://claude-${slug}.mycozy.cloud/?${new URLSearchParams(
        searchParams
      ).toString()}`
  )
}))

jest.mock('cozy-client/dist/models/note', () => ({
  fetchURL: jest.fn(async (client, file) => `https://notes/#/n/${file.id}`)
}))

const makeClient = (fetchJSON = jest.fn()) =>
  ({
    stackClient: { fetchJSON },
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  } as Parameters<typeof executeAction>[0])

describe('executeAction create_note', () => {
  it('POSTs to /notes with schema and converted content, returns note url', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({ data: { id: 'note-1' } })
    const result = await executeAction(makeClient(fetchJSON), 'create_note', {
      title: 'My summary',
      content: '# Points\n- one'
    })

    expect(fetchJSON).toHaveBeenCalledWith('POST', '/notes', {
      data: {
        type: 'io.cozy.notes.documents',
        attributes: expect.objectContaining({
          title: 'My summary',
          schema: expect.objectContaining({ topNode: 'doc' }),
          content: expect.objectContaining({ type: 'doc' })
        })
      }
    })
    expect(result.url).toBe('https://notes/#/n/note-1')
  })

  it('propagates execution errors', async () => {
    const fetchJSON = jest.fn().mockRejectedValue(new Error('403'))
    await expect(
      executeAction(makeClient(fetchJSON), 'create_note', {
        title: 't',
        content: 'c'
      })
    ).rejects.toThrow('403')
  })
})

describe('executeAction create_event', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockReturnValue(null)
  })

  afterEach(() => {
    openSpy.mockRestore()
  })

  it('opens the calendar app with prefill params', async () => {
    const result = await executeAction(makeClient(), 'create_event', {
      title: 'Sync',
      start: '2026-07-10T10:00:00',
      end: '',
      attendee: 'alice@example.com'
    })

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('claude-calendar'),
      '_blank',
      'noopener'
    )
    // empty params are not forwarded
    expect(result.url).not.toContain('end=')
    expect(result.url).toContain('title=Sync')
    expect(result.url).toContain('attendee=alice%40example.com')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/executeAction.spec.ts`
Expected: FAIL — `Cannot find module './executeAction'`.

- [ ] **Step 4: Write the implementation**

Create `packages/cozy-search/src/components/actions/executeAction.ts`:

```ts
import { generateWebLink } from 'cozy-client'
import { fetchURL } from 'cozy-client/dist/models/note'

import { CapabilityId } from './capabilities'
import { markdownToProseMirror, NOTES_SCHEMA } from './markdownToProseMirror'

export interface ActionClient {
  stackClient: {
    fetchJSON: (method: string, path: string, body?: object) => Promise<unknown>
  }
  getStackClient: () => { uri: string }
  getInstanceOptions: () => { subdomain: string }
}

export interface ExecuteResult {
  url?: string
}

const createNote = async (
  client: ActionClient,
  params: Record<string, string>
): Promise<ExecuteResult> => {
  const res = (await client.stackClient.fetchJSON('POST', '/notes', {
    data: {
      type: 'io.cozy.notes.documents',
      attributes: {
        title: params.title,
        schema: NOTES_SCHEMA,
        content: markdownToProseMirror(params.content || '')
      }
    }
  })) as { data: { id: string } }
  const url = await fetchURL(client, { id: res.data.id })
  return { url }
}

const createEvent = (
  client: ActionClient,
  params: Record<string, string>
): ExecuteResult => {
  // Deep-link prefill only (per spec): the calendar app may ignore unknown
  // query params, in which case the user finishes the event manually — the
  // card keeps the params visible either way.
  const searchParams = (
    [
      ['title', params.title],
      ['start', params.start],
      ['end', params.end],
      ['attendee', params.attendee]
    ] as Array<[string, string | undefined]>
  ).filter((entry): entry is [string, string] => !!entry[1])

  const url = generateWebLink({
    cozyUrl: client.getStackClient().uri,
    subDomainType: client.getInstanceOptions().subdomain,
    slug: 'calendar',
    searchParams
  })
  window.open(url, '_blank', 'noopener')
  return { url }
}

export const executeAction = async (
  client: ActionClient,
  id: CapabilityId,
  params: Record<string, string>
): Promise<ExecuteResult> => {
  if (id === 'create_note') {
    return createNote(client, params)
  }
  return createEvent(client, params)
}
```

If `tsc`/eslint reports that `generateWebLink` has no type in `cozy-client`'s
shipped types, add to `src/types.d.ts` (same pattern as the note model):

```ts
declare module 'cozy-client' {
  export function generateWebLink(options: any): string
}
```

⚠️ Only add this if the build actually complains — `cozy-client` ships
`types/index.d.ts` and other TS files in this package already import from it.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/executeAction.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/cozy-search/src/components/actions/executeAction.ts packages/cozy-search/src/components/actions/executeAction.spec.ts packages/cozy-search/src/types.d.ts
git commit -m "feat(cozy-search): Add note and calendar action executors"
```

---

### Task 5: LLM side-call (`fetchActionProposal`)

**Files:**
- Create: `packages/cozy-search/src/components/actions/fetchActionProposal.ts`
- Test: `packages/cozy-search/src/components/actions/fetchActionProposal.spec.ts`

**Interfaces:**
- Consumes: `Capability` (Task 1); `ActionProposal`, `extractActionJson` (Task 2).
- Produces: `interface SimpleMessage { role: 'user' | 'assistant'; content: string }`; `toSimpleMessages(messages: readonly MessageLike[]): SimpleMessage[]` (where `MessageLike = { role: string; content: ReadonlyArray<{ type: string; text?: string }> }`); `fetchActionProposal(client, capability, userQuery, history): Promise<ActionProposal | null>` with `client: { stackClient: { fetchJSON } }`. Used by Task 7 (adapter).

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/actions/fetchActionProposal.spec.ts`:

```ts
import { CAPABILITIES } from './capabilities'
import {
  fetchActionProposal,
  toSimpleMessages
} from './fetchActionProposal'

const createNote = CAPABILITIES[0]

const proposal = {
  sentence: 'Sure — click to create it.',
  action: 'create_note',
  params: { title: 'T', content: 'C' }
}

const makeClient = (fetchJSON: jest.Mock) => ({
  stackClient: { fetchJSON }
})

describe('fetchActionProposal', () => {
  it('POSTs to the completions proxy without a model and returns the proposal', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })

    const result = await fetchActionProposal(
      makeClient(fetchJSON),
      createNote,
      'Create a note summarizing this discussion',
      [{ role: 'assistant', content: 'Earlier answer' }]
    )

    expect(result).toEqual(proposal)
    expect(fetchJSON).toHaveBeenCalledTimes(1)
    const [method, path, body] = fetchJSON.mock.calls[0]
    expect(method).toBe('POST')
    expect(path).toBe('/ai/v1/chat/completions')
    // omitting "model" makes openRAG use direct-LLM mode (no RAG retrieval)
    expect(body.model).toBeUndefined()
    expect(body.stream).toBe(false)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('"create_note"')
    expect(body.messages[1]).toEqual({
      role: 'assistant',
      content: 'Earlier answer'
    })
    expect(body.messages[body.messages.length - 1]).toEqual({
      role: 'user',
      content: 'Create a note summarizing this discussion'
    })
  })

  it('returns null when the call rejects', async () => {
    const fetchJSON = jest.fn().mockRejectedValue(new Error('500'))
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('returns null on unparseable content', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'I cannot help with that.' } }]
    })
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('returns null on unexpected response shape', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({ unexpected: true })
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('keeps only the last 10 history messages', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })
    const history = Array.from({ length: 15 }, (_, i) => ({
      role: 'user' as const,
      content: `m${i}`
    }))
    await fetchActionProposal(makeClient(fetchJSON), createNote, 'q', history)
    const body = fetchJSON.mock.calls[0][2]
    // system + 10 history + final user query
    expect(body.messages).toHaveLength(12)
    expect(body.messages[1].content).toBe('m5')
  })
})

describe('toSimpleMessages', () => {
  it('flattens text parts and drops system/empty messages', () => {
    expect(
      toSimpleMessages([
        { role: 'system', content: [{ type: 'text', text: 'sys' }] },
        { role: 'user', content: [{ type: 'text', text: 'hello' }] },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'part one' },
            { type: 'tool-call' },
            { type: 'text', text: 'part two' }
          ]
        },
        { role: 'assistant', content: [{ type: 'tool-call' }] }
      ])
    ).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'part one\npart two' }
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/fetchActionProposal.spec.ts`
Expected: FAIL — `Cannot find module './fetchActionProposal'`.

- [ ] **Step 3: Write the implementation**

Create `packages/cozy-search/src/components/actions/fetchActionProposal.ts`:

```ts
import Minilog from 'cozy-minilog'

import { Capability } from './capabilities'
import { ActionProposal, extractActionJson } from './extractActionJson'

const log = Minilog('🔍 [fetchActionProposal]')

interface ProposalClient {
  stackClient: {
    fetchJSON: (method: string, path: string, body?: object) => Promise<unknown>
  }
}

export interface SimpleMessage {
  role: 'user' | 'assistant'
  content: string
}

interface MessageLike {
  role: string
  content: ReadonlyArray<{ type: string; text?: string }>
}

const MAX_HISTORY_MESSAGES = 10

/** Flatten assistant-ui thread messages into plain {role, content} pairs. */
export const toSimpleMessages = (
  messages: readonly MessageLike[]
): SimpleMessage[] =>
  messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => ({
      role: msg.role as SimpleMessage['role'],
      content: msg.content
        .filter(part => part.type === 'text' && !!part.text)
        .map(part => part.text)
        .join('\n')
    }))
    .filter(msg => msg.content !== '')

const buildSystemPrompt = (capability: Capability): string =>
  'You prepare the parameters of an app action for the user. ' +
  'Reply with ONLY one JSON object and nothing else — no markdown fence, no explanation. ' +
  'The JSON must match: {"sentence": string, "action": string, "params": object}. ' +
  '"sentence" is one short friendly sentence in the user\'s language inviting ' +
  'them to click the card below to confirm the action. ' +
  `"action" must be "${capability.id}". ` +
  capability.paramsPrompt +
  ` Today is ${new Date().toISOString()}.`

export const fetchActionProposal = async (
  client: ProposalClient,
  capability: Capability,
  userQuery: string,
  history: SimpleMessage[]
): Promise<ActionProposal | null> => {
  try {
    // No "model" field: openRAG treats the request as direct-LLM and skips
    // RAG retrieval and its sources-style answer prompt entirely.
    const res = (await client.stackClient.fetchJSON(
      'POST',
      '/ai/v1/chat/completions',
      {
        stream: false,
        temperature: 0,
        messages: [
          { role: 'system', content: buildSystemPrompt(capability) },
          ...history.slice(-MAX_HISTORY_MESSAGES),
          { role: 'user', content: userQuery }
        ]
      }
    )) as { choices?: Array<{ message?: { content?: unknown } }> }

    const content = res?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      log.warn('Unexpected completion response shape')
      return null
    }
    return extractActionJson(content, capability)
  } catch (error) {
    log.error('Action proposal call failed:', error)
    return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/fetchActionProposal.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-search/src/components/actions/fetchActionProposal.ts packages/cozy-search/src/components/actions/fetchActionProposal.spec.ts
git commit -m "feat(cozy-search): Add LLM side-call for action proposals"
```

---

### Task 6: Action card UI + tool UI registrations

**Files:**
- Create: `packages/cozy-search/src/components/actions/ActionCard.tsx`
- Create: `packages/cozy-search/src/components/actions/ActionToolUIs.tsx`
- Test: `packages/cozy-search/src/components/actions/ActionCard.spec.tsx`

**Interfaces:**
- Consumes: `CapabilityId` (Task 1); `executeAction`, `ExecuteResult`, `ActionClient` (Task 4); `makeAssistantToolUI` from `@assistant-ui/react`; `useClient` from `cozy-client`; `useI18n` from `twake-i18n`; cozy-ui `Paper`, `Typography`, `Buttons`, `Alert`.
- Produces: `ActionCard` (default export, props `{ capabilityId: CapabilityId; args: Record<string, string>; execute: () => Promise<ExecuteResult> }`); `CreateNoteToolUI` and `CreateEventToolUI` (React components to mount once inside the runtime provider — Task 8). Locale keys used here are added in Task 8; tests mock `t` to return the key.

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/actions/ActionCard.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import ActionCard from './ActionCard'

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
  useExtendI18n: jest.fn()
}))

describe('ActionCard', () => {
  const args = { title: 'My note', content: '# Body' }

  it('shows title, params and the confirm button in proposed state', () => {
    render(
      <ActionCard
        capabilityId="create_note"
        args={args}
        execute={jest.fn()}
      />
    )
    expect(
      screen.getByText('assistant.app_actions.create_note.title')
    ).toBeTruthy()
    expect(screen.getByText(/My note/)).toBeTruthy()
    expect(
      screen.getByText('assistant.app_actions.create_note.confirm')
    ).toBeTruthy()
  })

  it('executes on click and shows the done state with a link', async () => {
    const execute = jest
      .fn()
      .mockResolvedValue({ url: 'https://notes/#/n/1' })
    render(
      <ActionCard capabilityId="create_note" args={args} execute={execute} />
    )

    fireEvent.click(
      screen.getByText('assistant.app_actions.create_note.confirm')
    )

    expect(execute).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText('assistant.app_actions.create_note.done')
    ).toBeTruthy()
    const link = screen
      .getByText('assistant.app_actions.create_note.open')
      .closest('a')
    expect(link?.getAttribute('href')).toBe('https://notes/#/n/1')
  })

  it('shows the error state with retry on failure, retry re-executes', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new Error('403'))
      .mockResolvedValueOnce({ url: 'https://notes/#/n/1' })
    render(
      <ActionCard capabilityId="create_note" args={args} execute={execute} />
    )

    fireEvent.click(
      screen.getByText('assistant.app_actions.create_note.confirm')
    )
    expect(
      await screen.findByText('assistant.app_actions.error')
    ).toBeTruthy()

    fireEvent.click(screen.getByText('assistant.app_actions.retry'))
    expect(
      await screen.findByText('assistant.app_actions.create_note.done')
    ).toBeTruthy()
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('hides empty params and truncates long values', () => {
    render(
      <ActionCard
        capabilityId="create_event"
        args={{ title: 'x'.repeat(200), attendee: '' }}
        execute={jest.fn()}
      />
    )
    expect(
      screen.queryByText('assistant.app_actions.params.attendee')
    ).toBeNull()
    expect(screen.getByText(/x{10,}…/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/actions/ActionCard.spec.tsx`
Expected: FAIL — `Cannot find module './ActionCard'`.

- [ ] **Step 3: Write ActionCard**

Create `packages/cozy-search/src/components/actions/ActionCard.tsx`:

```tsx
import React, { useState } from 'react'

import Alert from 'cozy-ui/transpiled/react/Alert'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { CapabilityId } from './capabilities'
import { ExecuteResult } from './executeAction'

type ActionCardStatus = 'proposed' | 'executing' | 'done' | 'error'

interface ActionCardProps {
  capabilityId: CapabilityId
  args: Record<string, string>
  execute: () => Promise<ExecuteResult>
}

const MAX_PARAM_LENGTH = 120

/**
 * Confirm-first card for an assistant app action: nothing is executed
 * until the user clicks. State is component-local only (demo scope —
 * action exchanges are not persisted).
 */
const ActionCard = ({
  capabilityId,
  args,
  execute
}: ActionCardProps): JSX.Element => {
  const { t } = useI18n()
  const [status, setStatus] = useState<ActionCardStatus>('proposed')
  const [url, setUrl] = useState<string | undefined>(undefined)

  const handleConfirm = async (): Promise<void> => {
    setStatus('executing')
    try {
      const result = await execute()
      setUrl(result.url)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const shownParams = Object.entries(args).filter(([, value]) => !!value)

  return (
    <Paper elevation={2} className="u-p-1 u-mt-half">
      <Typography variant="h6">
        {t(`assistant.app_actions.${capabilityId}.title`)}
      </Typography>
      <div className="u-stack-half u-mt-half">
        {shownParams.map(([key, value]) => (
          <Typography key={key} variant="body2">
            <span className="u-fw-bold">
              {t(`assistant.app_actions.params.${key}`)}
            </span>
            {': '}
            {value.length > MAX_PARAM_LENGTH
              ? `${value.slice(0, MAX_PARAM_LENGTH)}…`
              : value}
          </Typography>
        ))}
      </div>
      {(status === 'proposed' || status === 'executing') && (
        <Button
          className="u-mt-1"
          variant="primary"
          busy={status === 'executing'}
          disabled={status === 'executing'}
          label={t(`assistant.app_actions.${capabilityId}.confirm`)}
          onClick={handleConfirm}
        />
      )}
      {status === 'done' && (
        <Alert
          className="u-mt-1"
          severity="success"
          action={
            url ? (
              <Button
                size="small"
                variant="text"
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                label={t(`assistant.app_actions.${capabilityId}.open`)}
              />
            ) : undefined
          }
        >
          {t(`assistant.app_actions.${capabilityId}.done`)}
        </Alert>
      )}
      {status === 'error' && (
        <Alert
          className="u-mt-1"
          severity="error"
          action={
            <Button
              size="small"
              variant="text"
              label={t('assistant.app_actions.retry')}
              onClick={handleConfirm}
            />
          }
        >
          {t('assistant.app_actions.error')}
        </Alert>
      )}
    </Paper>
  )
}

export default ActionCard
```

- [ ] **Step 4: Write the tool UI registrations**

Create `packages/cozy-search/src/components/actions/ActionToolUIs.tsx`:

```tsx
import { makeAssistantToolUI } from '@assistant-ui/react'
import React from 'react'

import { useClient } from 'cozy-client'

import ActionCard from './ActionCard'
import { CapabilityId } from './capabilities'
import { ActionClient, executeAction } from './executeAction'

interface ActionToolRendererProps {
  capabilityId: CapabilityId
  args: Record<string, string>
}

const ActionToolRenderer = ({
  capabilityId,
  args
}: ActionToolRendererProps): JSX.Element => {
  const client = useClient()
  return (
    <ActionCard
      capabilityId={capabilityId}
      args={args}
      execute={(): ReturnType<typeof executeAction> =>
        executeAction(client as unknown as ActionClient, capabilityId, args)
      }
    />
  )
}

const makeActionToolUI = (
  capabilityId: CapabilityId
): ReturnType<typeof makeAssistantToolUI> =>
  makeAssistantToolUI<Record<string, string>, unknown>({
    toolName: capabilityId,
    render: ({ args }) => (
      <ActionToolRenderer capabilityId={capabilityId} args={args} />
    )
  })

// Mount these once inside AssistantRuntimeProvider (see
// CozyAssistantRuntimeProvider); they register a card renderer for the
// matching tool-call content parts and render nothing themselves.
export const CreateNoteToolUI = makeActionToolUI('create_note')
export const CreateEventToolUI = makeActionToolUI('create_event')
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/cozy-search && yarn test src/components/actions/ActionCard.spec.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/cozy-search/src/components/actions/ActionCard.tsx packages/cozy-search/src/components/actions/ActionToolUIs.tsx packages/cozy-search/src/components/actions/ActionCard.spec.tsx
git commit -m "feat(cozy-search): Add confirm-first action card tool UIs"
```

---

### Task 7: Adapter branch — detect intent, side-call, yield tool-call

**Files:**
- Modify: `packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.ts` (insert branch after the `findUserQuery` guard, around line 78, BEFORE `streamBridge.createStream`)
- Test: `packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.spec.ts` (new file)

**Interfaces:**
- Consumes: `matchCapability` (Task 1); `fetchActionProposal`, `toSimpleMessages` (Task 5).
- Produces: unchanged adapter signature. New behavior: on regex match + successful proposal, `run` yields one final result whose `content` is `[{ type: 'text', text: sentence }, { type: 'tool-call', toolCallId, toolName: capability.id, args, argsText }]` with `status: { type: 'complete', reason: 'stop' }`, and returns WITHOUT touching StreamBridge or the conversation endpoint. On any proposal failure it falls through to the existing flow unchanged.

- [ ] **Step 1: Write the failing test**

Create `packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.spec.ts`:

```ts
import type { ChatModelRunOptions } from '@assistant-ui/react'

import { createCozyRealtimeChatAdapter } from './CozyRealtimeChatAdapter'
import type { StreamBridge } from './StreamBridge'

const makeStreamBridge = (): StreamBridge =>
  ({
    createStream: jest.fn(async function* () {
      // empty stream: the normal flow completes immediately
    }),
    getSources: jest.fn(() => null),
    cleanup: jest.fn()
  } as unknown as StreamBridge)

const runAdapter = async (
  query: string,
  fetchJSON: jest.Mock
): Promise<Array<{ content: Array<Record<string, unknown>> }>> => {
  const adapter = createCozyRealtimeChatAdapter(
    {
      client: { stackClient: { fetchJSON } },
      conversationId: 'conv-1'
    },
    (key: string) => key,
    { current: makeStreamBridge() }
  )
  const results: Array<{ content: Array<Record<string, unknown>> }> = []
  const options = {
    messages: [{ role: 'user', content: [{ type: 'text', text: query }] }],
    abortSignal: new AbortController().signal
  } as unknown as ChatModelRunOptions
  for await (const result of adapter.run(options)) {
    results.push(result as { content: Array<Record<string, unknown>> })
  }
  return results
}

describe('CozyRealtimeChatAdapter action branch', () => {
  const proposal = {
    sentence: 'Sure, click to confirm.',
    action: 'create_note',
    params: { title: 'My note', content: '# Summary' }
  }

  it('yields text + tool-call and skips the conversation flow on match', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })

    const results = await runAdapter(
      'Create a note summarizing this discussion',
      fetchJSON
    )

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/v1/chat/completions',
      expect.any(Object)
    )
    expect(fetchJSON).not.toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )

    const last = results[results.length - 1]
    expect(last.content.find(p => p.type === 'text')).toMatchObject({
      text: 'Sure, click to confirm.'
    })
    expect(last.content.find(p => p.type === 'tool-call')).toMatchObject({
      toolName: 'create_note',
      args: proposal.params
    })
  })

  it('keeps the normal conversation flow for non-action messages', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({})

    const results = await runAdapter('What is the weather like?', fetchJSON)

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )
    expect(
      results.every(r => r.content.every(p => p.type !== 'tool-call'))
    ).toBe(true)
  })

  it('falls back to the conversation flow when the side-call fails', async () => {
    const fetchJSON = jest.fn((method: string, path: string) =>
      path === '/ai/v1/chat/completions'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({})
    )

    const results = await runAdapter(
      'Crée une note avec le résumé de cette discussion',
      fetchJSON
    )

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )
    expect(
      results.every(r => r.content.every(p => p.type !== 'tool-call'))
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/cozy-search && yarn test src/components/adapters/CozyRealtimeChatAdapter.spec.ts`
Expected: FAIL — first test fails: `fetchJSON` WAS called with `/ai/chat/conversations/conv-1` (no branch exists yet) and no `tool-call` part is found.

- [ ] **Step 3: Implement the branch**

In `packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.ts`:

Add imports after the existing `sanitizeChatContent` import:

```ts
import { matchCapability } from '../actions/capabilities'
import {
  fetchActionProposal,
  toSimpleMessages
} from '../actions/fetchActionProposal'
```

Then insert the branch inside `run`, immediately after the `if (!userQuery) { … return }` guard and BEFORE `const stream = streamBridge.createStream(conversationId)`:

```ts
    // Demo app-action branch: on an action intent, ask the LLM directly
    // (stack /ai/v1/chat/completions proxy) for structured params and yield
    // a confirm-first tool-call card instead of the conversation flow.
    // This exchange is not persisted in the conversation (demo trade-off).
    const capability = matchCapability(userQuery)
    if (capability) {
      yield {
        content: [{ type: 'text', text: '' }],
        status: { type: 'requires-action', reason: 'tool-calls' }
      }
      const proposal = await fetchActionProposal(
        client,
        capability,
        userQuery,
        toSimpleMessages(messages.slice(0, -1))
      )
      if (proposal && !abortSignal?.aborted) {
        yield {
          content: [
            { type: 'text', text: proposal.sentence },
            {
              type: 'tool-call',
              toolCallId: `${capability.id}-${Date.now()}`,
              toolName: capability.id,
              args: proposal.params,
              argsText: JSON.stringify(proposal.params)
            }
          ],
          status: { type: 'complete', reason: 'stop' }
        }
        return
      }
      log.warn('Action proposal unavailable, falling back to chat flow')
    }
```

Note: `messages.slice(0, -1)` excludes the current user message from history —
it is passed separately as `userQuery`. `toSimpleMessages` accepts the
assistant-ui messages structurally; if `tsc` complains about readonly content
part types, cast with `toSimpleMessages(messages.slice(0, -1) as unknown as Parameters<typeof toSimpleMessages>[0])`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/cozy-search && yarn test src/components/adapters/`
Expected: PASS — the 3 new tests AND the existing `StreamBridge.spec.ts` all green.

- [ ] **Step 5: Commit**

```bash
git add packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.ts packages/cozy-search/src/components/adapters/CozyRealtimeChatAdapter.spec.ts
git commit -m "feat(cozy-search): Branch chat adapter on app action intents"
```

---

### Task 8: Wire tool UIs into the runtime provider, add locales, full verification

**Files:**
- Modify: `packages/cozy-search/src/components/CozyAssistantRuntimeProvider.tsx` (mount the two tool UIs, ~line 336)
- Modify: `packages/cozy-search/src/locales/en.json`
- Modify: `packages/cozy-search/src/locales/fr.json`

**Interfaces:**
- Consumes: `CreateNoteToolUI`, `CreateEventToolUI` (Task 6).
- Produces: the complete feature, live in the chat UI.

- [ ] **Step 1: Mount the tool UIs**

In `packages/cozy-search/src/components/CozyAssistantRuntimeProvider.tsx`, add the import (with the other relative imports):

```ts
import { CreateNoteToolUI, CreateEventToolUI } from './actions/ActionToolUIs'
```

and change the return of `CozyAssistantRuntimeProviderInner` from:

```tsx
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
```

to:

```tsx
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <CreateNoteToolUI />
      <CreateEventToolUI />
      {children}
    </AssistantRuntimeProvider>
  )
```

(The tool UI components render nothing; they register the card renderer for
`tool-call` parts with matching `toolName` — `MessagePrimitive.Content` in
`Messages/AssistantMessage.jsx` then renders the cards with no change there.)

- [ ] **Step 2: Add locale keys**

In `packages/cozy-search/src/locales/en.json`, inside the top-level `"assistant"` object (sibling of `"knowledge_base"`), add:

```json
"app_actions": {
  "error": "The action could not be completed.",
  "retry": "Retry",
  "create_note": {
    "title": "New note",
    "confirm": "Create the note",
    "done": "Note created.",
    "open": "Open the note"
  },
  "create_event": {
    "title": "New calendar event",
    "confirm": "Open in Calendar",
    "done": "Calendar opened.",
    "open": "Reopen"
  },
  "params": {
    "title": "Title",
    "content": "Content",
    "start": "Start",
    "end": "End",
    "attendee": "With"
  }
}
```

In `packages/cozy-search/src/locales/fr.json`, same position:

```json
"app_actions": {
  "error": "L'action n'a pas pu aboutir.",
  "retry": "Réessayer",
  "create_note": {
    "title": "Nouvelle note",
    "confirm": "Créer la note",
    "done": "Note créée.",
    "open": "Ouvrir la note"
  },
  "create_event": {
    "title": "Nouvel événement",
    "confirm": "Ouvrir dans l'agenda",
    "done": "Agenda ouvert.",
    "open": "Rouvrir"
  },
  "params": {
    "title": "Titre",
    "content": "Contenu",
    "start": "Début",
    "end": "Fin",
    "attendee": "Avec"
  }
}
```

(`ru.json` / `vi.json` intentionally untouched — precedent: the knowledge_base
feature ships en/fr only; twake-i18n falls back to en.)

- [ ] **Step 3: Full verification**

```bash
cd packages/cozy-search
yarn test            # full suite
yarn lint            # eslint over the package
yarn build           # babel + tsc type-check (build:types)
```

Expected: all pass. Fix anything that fails (likely suspects: missing type
declarations for cozy-client subpaths — handle per Task 4 note; import order
lint — run `yarn lint --fix` variant via `cd .. && yarn eslint --fix --ext js,jsx,ts,tsx packages/cozy-search`).

- [ ] **Step 4: Commit**

```bash
git add packages/cozy-search/src/components/CozyAssistantRuntimeProvider.tsx packages/cozy-search/src/locales/en.json packages/cozy-search/src/locales/fr.json
git commit -m "feat(cozy-search): Mount app action tool UIs and locales"
```

- [ ] **Step 5: Manual E2E (demo script) — requires a dev instance**

This is the demo acceptance check; it needs a running Cozy dev instance with
the assistant enabled (RAG server configured) and a host app embedding the
cozy-search assistant.

1. `cd packages/cozy-search && yarn build`, then link/copy `dist` into the host app per your usual dev flow (`yarn link` or the host app's local-libs override).
2. Verify the host app's manifest includes POST permission on `io.cozy.files` (note creation needs it; the stack also accepts finer per-directory perms). If missing, add it to the dev manifest.
3. Open the assistant chat. Send: *"Crée une note avec un résumé de cette discussion"* after a couple of normal exchanges.
   - Expect: brief "running" state, then a sentence + "Nouvelle note" card with title/content preview. Nothing created yet.
   - Click "Créer la note" → success alert with "Ouvrir la note" linking to the created note. Verify the note exists (default `Notes` folder if the LLM gave no dir) and its content matches.
4. Send: *"Schedule a meeting with Alice next Friday at 10am"*.
   - Expect: card with title/start/attendee. Click → Twake Calendar opens in a new tab (prefill is best-effort; the card keeps the params visible).
   - Note the actual behavior of the calendar deep-link (params honored or ignored) in the demo notes.
5. Negative checks: a normal question streams as before (RAG mode, sources chip intact); killing the RAG server and sending an action phrase falls back to the normal flow's error handling; reloading the page drops the action exchange (expected, per spec).

---

## Plan Self-Review (completed)

- **Spec coverage:** capability registry → Task 1; JSON extraction tolerant of fences/prose → Task 2; markdown→ProseMirror + POST /notes + note URL → Tasks 3–4; calendar deep-link with visible params → Task 4; side-call to `/ai/v1/chat/completions` without `model`, history included, all-failures-fall-back → Tasks 5 & 7; text + tool-call parts, `makeAssistantToolUI` cards, proposed/executing/done/error → Tasks 6–7; mounting, locales, non-persistence statement, manual E2E incl. permission check → Task 8. No gaps.
- **Placeholders:** none; the two "if the build complains" notes are concrete contingency instructions with exact code, not deferrals.
- **Type consistency:** `Capability`/`CapabilityId`/`matchCapability` (T1) ← T2/T5/T7; `ActionProposal`/`extractActionJson` (T2) ← T5; `PmNode`/`NOTES_SCHEMA`/`markdownToProseMirror` (T3) ← T4; `ActionClient`/`ExecuteResult`/`executeAction` (T4) ← T6; `SimpleMessage`/`toSimpleMessages`/`fetchActionProposal` (T5) ← T7; `CreateNoteToolUI`/`CreateEventToolUI` (T6) ← T8. Verified matching names and signatures.
