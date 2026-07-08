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
