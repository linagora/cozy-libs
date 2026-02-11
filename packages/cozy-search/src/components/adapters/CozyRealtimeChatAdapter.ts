/**
 * CozyRealtimeChatAdapter implements assistant-ui's ChatModelAdapter interface
 * to integrate with the Cozy backend's AI chat API.
 *
 * This adapter:
 * 1. POSTs to /ai/chat/conversations/{conversationId} to start a conversation
 * 2. Uses StreamBridge to receive streaming content from WebSocket events
 * 3. Yields content progressively as it arrives
 */

import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult
} from '@assistant-ui/react'

import Minilog from 'cozy-minilog'

import { StreamBridge } from './StreamBridge'
import { sanitizeChatContent } from '../helpers'

const log = Minilog('🔍 [CozyRealtimeChatAdapter]')

type CozyClient = {
  stackClient: {
    fetchJSON: (method: string, path: string, body?: object) => Promise<unknown>
  }
}

export interface CozyRealtimeChatAdapterOptions {
  client: CozyClient
  conversationId: string
  streamBridge: StreamBridge
}

/**
 * Finds the user query to send to the backend.
 * For new messages: gets the last user message
 * For reload: finds the last user message (may need to skip assistant messages)
 */
const findUserQuery = (
  messages: ChatModelRunOptions['messages']
): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'user') {
      const textContent = msg.content.find(part => part.type === 'text')
      if (textContent && textContent.type === 'text') {
        return textContent.text
      }
    }
  }
  return null
}

/**
 * Creates a ChatModelAdapter that integrates with Cozy's backend.
 * The adapter posts messages to the backend and yields streaming responses
 * from the WebSocket via StreamBridge.
 */
export const createCozyRealtimeChatAdapter = (
  options: CozyRealtimeChatAdapterOptions,
  t: (key: string, options?: Record<string, unknown> | undefined) => string
): ChatModelAdapter => ({
  async *run({
    messages,
    abortSignal
  }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    const { client, conversationId, streamBridge } = options

    const userQuery = findUserQuery(messages)
    if (!userQuery) {
      log.error('No user message found in:', messages)
      return
    }

    const stream = streamBridge.createStream(conversationId)

    try {
      // Note: For reload, this sends the same query again to regenerate
      await client.stackClient.fetchJSON(
        'POST',
        `/ai/chat/conversations/${conversationId}`,
        { q: userQuery }
      )

      let fullText = ''
      let wasAborted = false

      for await (const chunk of stream) {
        if (abortSignal?.aborted) {
          wasAborted = true
          streamBridge.cleanup(conversationId)
          break
        }

        fullText += chunk
        const sanitizedText = sanitizeChatContent(fullText)

        yield {
          content: [{ type: 'text', text: sanitizedText }],
          status: { type: 'running' }
        }
      }

      if (!wasAborted) {
        const finalText = sanitizeChatContent(fullText)
        yield {
          content: [{ type: 'text', text: finalText }],
          status: { type: 'complete', reason: 'stop' }
        }
        streamBridge.cleanup(conversationId)
      }
    } catch (error) {
      log.error('Error:', error)
      streamBridge.cleanup(conversationId)

      yield {
        content: [{ type: 'text', text: t('assistant.default_error') }],
        status: { type: 'incomplete', reason: 'error' }
      }
    }
  }
})
