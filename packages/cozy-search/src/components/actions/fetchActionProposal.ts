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
  'The JSON must match: {"sentence": string, "action": string, "lang": string, "params": object}. ' +
  '"sentence" is one short friendly sentence in the user\'s language inviting ' +
  'them to click the card below to confirm the action. ' +
  '"lang" is the two-letter code of the language the user wrote in: "fr" or "en". ' +
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
