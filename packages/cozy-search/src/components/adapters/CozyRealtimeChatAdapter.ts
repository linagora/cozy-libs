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
import { DEFAULT_ASSISTANT } from '../constants'
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
  assistantId?: string
  websearchEnabled?: boolean
  attachmentIds?: string[]
  attachmentsBlocked?: boolean
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
  t: (key: string, options?: Record<string, unknown>) => string,
  streamBridgeRef: { current: StreamBridge }
): ChatModelAdapter => ({
  async *run({
    messages,
    abortSignal
  }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    const {
      client,
      conversationId,
      assistantId,
      websearchEnabled,
      attachmentIds,
      attachmentsBlocked
    } = options
    const streamBridge = streamBridgeRef.current

    const userQuery = findUserQuery(messages)
    if (!userQuery) {
      log.error('No user message found in:', messages)
      return
    }

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

    const stream = streamBridge.createStream(conversationId)

    if (abortSignal?.aborted) {
      streamBridge.cleanup(conversationId)
      return
    }

    try {
      // Note: For reload, this sends the same query again to regenerate
      yield {
        content: [{ type: 'text', text: '' }],
        status: { type: 'requires-action', reason: 'tool-calls' }
      }
      await client.stackClient.fetchJSON(
        'POST',
        `/ai/chat/conversations/${conversationId}`,
        {
          q: userQuery,
          // The default assistant is a client-side sentinel with no CouchDB
          // document behind it: sending its id would make the stack store a
          // dangling relationship and fail rag-query on assistant resolution.
          ...(assistantId &&
            assistantId !== DEFAULT_ASSISTANT._id && {
              assistantID: assistantId
            }),
          ...(websearchEnabled && { websearch: true }),
          ...(attachmentIds &&
            attachmentIds.length > 0 && { attachmentIDs: attachmentIds })
        }
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
        const sources = streamBridge.getSources(conversationId)
        yield {
          content: [{ type: 'text', text: finalText }],
          status: { type: 'complete', reason: 'stop' },
          ...(sources ? { metadata: { custom: { sources } } } : {})
        }
        streamBridge.cleanup(conversationId)
      }
    } catch (error) {
      log.error('Error:', error)
      streamBridge.cleanup(conversationId)

      yield {
        content: [{ type: 'text', text: t('assistant.default_error') }],
        status: { type: 'incomplete', reason: 'error' },
        metadata: { custom: { isError: true } }
      }
    }
  }
})
