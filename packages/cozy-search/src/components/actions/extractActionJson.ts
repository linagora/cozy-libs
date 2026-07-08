import { Capability, CapabilityId } from './capabilities'

export type ActionLang = 'en' | 'fr'

export interface ActionProposal {
  sentence: string
  action: CapabilityId
  /** Language of the user's request, so the card can match it */
  lang?: ActionLang
  params: Record<string, string>
}

const isActionLang = (value: unknown): value is ActionLang =>
  value === 'en' || value === 'fr'

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
    key => typeof params[key] === 'string' && params[key].trim() !== ''
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
      const params = parsed.params as Record<string, unknown>
      const lang = (parsed as Record<string, unknown>).lang
      return {
        sentence: parsed.sentence,
        action: parsed.action,
        ...(isActionLang(lang) ? { lang } : {}),
        params: Object.fromEntries(
          capability.knownParams
            .map((key): [string, unknown] => [key, params[key]])
            .filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string'
            )
        )
      }
    }
  }
  return null
}
