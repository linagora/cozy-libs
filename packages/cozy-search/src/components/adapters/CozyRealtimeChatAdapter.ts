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

import { StreamBridge } from './StreamBridge'
import { sanitizeChatContent } from '../helpers'

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
  // Find the last user message in the conversation
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
  options: CozyRealtimeChatAdapterOptions
): ChatModelAdapter => ({
  async *run({
    messages,
    abortSignal,
    runConfig
  }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    const { client, conversationId, streamBridge } = options

    // Find the user query (handles both new messages and reload)
    const userQuery = findUserQuery(messages)
    if (!userQuery) {
      console.error('[CozyRealtimeChatAdapter] No user message found in:', messages)
      return
    }

    // Create stream before posting to ensure we don't miss events
    const stream = streamBridge.createStream(conversationId)

    try {
      // POST to start/continue the conversation
      // Note: For reload, this sends the same query again to regenerate
      console.log('[CozyRealtimeChatAdapter] Sending query:', userQuery.slice(0, 50) + '...')
      await client.stackClient.fetchJSON(
        'POST',
        `/ai/chat/conversations/${conversationId}`,
        {
          q: userQuery,
          ...(runConfig?.custom || {})
        }
      )
      console.log('[CozyRealtimeChatAdapter] POST successful, waiting for stream...')

      let fullText = ''
      let wasAborted = false

      // Yield chunks as they arrive via WebSocket
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

      // Only yield final complete status if not aborted
      if (!wasAborted) {
        const finalText = sanitizeChatContent(fullText)
        yield {
          content: [{ type: 'text', text: finalText }],
          status: { type: 'complete', reason: 'stop' }
        }
      }
    } catch (error) {
      console.error('[CozyRealtimeChatAdapter] Error:', error)
      streamBridge.cleanup(conversationId)

      // Yield an error status so the UI can display it
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      yield {
        content: [{ type: 'text', text: `Error: ${errorMessage}` }],
        status: { type: 'incomplete', reason: 'error' }
      }
    }
  }
})
