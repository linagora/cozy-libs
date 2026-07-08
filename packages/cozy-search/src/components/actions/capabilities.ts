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
  /**
   * Params rendered on the confirmation card. Anything else the LLM
   * returns is dropped so unknown keys never leak raw i18n keys into the UI.
   */
  knownParams: string[]
}

// Input is stripped of diacritics before matching (see stripAccents), so the
// patterns are written accent-free: "cree" also covers crée/créé/créer.
const NOTE_VERB = /(cree|redige|ecris|fais|create|make|write|take)/i
const NOTE_OBJECT = /\bnotes?\b/i
const EVENT_VERB =
  /(cree|planifie|organise|ajoute|programme|create|schedule|plan|add|set\s?up|book)/i
const EVENT_OBJECT =
  /(reunion|rendez[- ]vous|\brdv\b|meeting|\bevents?\b|evenement|visio|\bcall\b)/i

const stripAccents = (text: string): string =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
    requiredParams: ['title', 'content'],
    knownParams: ['title', 'content']
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
    requiredParams: ['title', 'start'],
    knownParams: ['title', 'start', 'end', 'attendee']
  }
]

export const matchCapability = (text: string): Capability | null => {
  const normalized = stripAccents(text)
  return CAPABILITIES.find(capability => capability.match(normalized)) ?? null
}
