/**
 * CozyAssistantRuntimeProvider wraps assistant-ui's runtime with Cozy's
 * real-time WebSocket integration.
 *
 * This provider:
 * - Creates and manages the StreamBridge for WebSocket events
 * - Sets up cozy-realtime subscriptions to feed the bridge
 * - Creates the ChatModelAdapter for the conversation
 * - Loads existing conversation history from CouchDB
 * - Provides the runtime to child components via AssistantRuntimeProvider
 */

import React, { useMemo, useRef, useEffect, ReactNode } from 'react'
import { useParams } from 'react-router-dom'

import { useClient, useQuery, isQueryLoading } from 'cozy-client'
import useRealtime from 'cozy-realtime/dist/useRealtime'
import {
  AssistantRuntimeProvider,
  useLocalRuntime
} from '@assistant-ui/react'
import type { ThreadMessageLike } from '@assistant-ui/react'

import { StreamBridge } from './adapters/StreamBridge'
import { createCozyRealtimeChatAdapter } from './adapters/CozyRealtimeChatAdapter'
import {
  CHAT_EVENTS_DOCTYPE,
  CHAT_CONVERSATIONS_DOCTYPE,
  buildChatConversationQueryById
} from './queries'
import { sanitizeChatContent } from './helpers'

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ id: string }>
}

interface Conversation {
  _id: string
  messages?: ConversationMessage[]
}

interface CozyAssistantRuntimeProviderProps {
  children: ReactNode
}

/**
 * Converts CouchDB conversation messages to assistant-ui's ThreadMessageLike format.
 */
const convertMessagesToThreadMessages = (
  messages: ConversationMessage[] | undefined
): ThreadMessageLike[] => {
  if (!messages) return []

  return messages.map((msg, idx) => ({
    id: msg.id || `msg-${idx}`,
    role: msg.role as 'user' | 'assistant',
    content: sanitizeChatContent(msg.content),
    metadata:
      msg.role === 'assistant' && msg.sources
        ? { custom: { sources: msg.sources } }
        : undefined
  }))
}

/**
 * Loader component that waits for conversation data before rendering the runtime
 */
const ConversationLoader = ({
  children,
  conversationId
}: CozyAssistantRuntimeProviderProps & { conversationId: string }) => {
  // Query existing conversation
  const conversationQuery = buildChatConversationQueryById(conversationId)
  const queryResult = useQuery(
    conversationQuery.definition,
    conversationQuery.options
  ) as { data: Conversation | undefined; fetchStatus: string }
  const conversation = queryResult.data
  const isLoading = isQueryLoading(queryResult)

  // Convert existing messages to assistant-ui format
  const initialMessages = useMemo(
    () => convertMessagesToThreadMessages(conversation?.messages),
    [conversation?.messages]
  )

  // Wait for initial query to complete before rendering the runtime
  if (isLoading) {
    return null
  }

  return (
    <CozyAssistantRuntimeProviderInner
      conversationId={conversationId}
      initialMessages={initialMessages}
    >
      {children}
    </CozyAssistantRuntimeProviderInner>
  )
}

const CozyAssistantRuntimeProviderInner = ({
  children,
  conversationId,
  initialMessages
}: CozyAssistantRuntimeProviderProps & {
  conversationId: string
  initialMessages: ThreadMessageLike[]
}) => {
  const client = useClient()
  const streamBridgeRef = useRef(new StreamBridge())
  const messagesIdRef = useRef<string[]>([])
  // Track IDs of messages that have been cancelled - events for these are rejected
  const cancelledMessageIdsRef = useRef<Set<string>>(new Set())
  // Track the ID of the message that's currently streaming (for cancellation tracking)
  const currentStreamingMessageIdRef = useRef<string | null>(null)

  // Initialize message IDs from initial messages
  useEffect(() => {
    messagesIdRef.current = initialMessages.map(m => m.id).filter((id): id is string => !!id)
  }, [])

  // Set up cleanup callback to cancel current message when stop is clicked
  useEffect(() => {
    streamBridgeRef.current.setCleanupCallback(() => {
      if (currentStreamingMessageIdRef.current) {
        cancelledMessageIdsRef.current.add(currentStreamingMessageIdRef.current)
        currentStreamingMessageIdRef.current = null
      }
    })
  }, [])

  // Handle conversation document updates (to track message IDs)
  useRealtime(
    client,
    {
      [CHAT_CONVERSATIONS_DOCTYPE]: {
        created: (res: Conversation) => {
          if (res._id === conversationId && res.messages) {
            const newIds = res.messages.map(m => m.id)
            // Find new assistant message ID (most recent that we don't have yet)
            const lastAssistantMsg = res.messages
              .filter(m => m.role === 'assistant')
              .pop()
            if (
              lastAssistantMsg &&
              !messagesIdRef.current.includes(lastAssistantMsg.id)
            ) {
              // If there was a previous streaming message that's different, mark it cancelled
              if (
                currentStreamingMessageIdRef.current &&
                currentStreamingMessageIdRef.current !== lastAssistantMsg.id
              ) {
                cancelledMessageIdsRef.current.add(
                  currentStreamingMessageIdRef.current
                )
              }
              currentStreamingMessageIdRef.current = lastAssistantMsg.id
            }
            messagesIdRef.current = newIds
          }
        },
        updated: (res: Conversation) => {
          if (res._id === conversationId && res.messages) {
            const newIds = res.messages.map(m => m.id)
            // Find new assistant message ID (most recent that we don't have yet)
            const lastAssistantMsg = res.messages
              .filter(m => m.role === 'assistant')
              .pop()
            if (
              lastAssistantMsg &&
              !messagesIdRef.current.includes(lastAssistantMsg.id)
            ) {
              // If there was a previous streaming message that's different, mark it cancelled
              if (
                currentStreamingMessageIdRef.current &&
                currentStreamingMessageIdRef.current !== lastAssistantMsg.id
              ) {
                cancelledMessageIdsRef.current.add(
                  currentStreamingMessageIdRef.current
                )
              }
              currentStreamingMessageIdRef.current = lastAssistantMsg.id
            }
            messagesIdRef.current = newIds
          }
        }
      }
    },
    [conversationId]
  )

  // Handle streaming events from WebSocket
  useRealtime(
    client,
    {
      [CHAT_EVENTS_DOCTYPE]: {
        created: (res: {
          _id: string
          object: 'delta' | 'done' | 'generated' | 'sources'
          position?: number[]
          content?: string
        }) => {
          // Reject events for messages that have been cancelled
          if (cancelledMessageIdsRef.current.has(res._id)) {
            return
          }

          // Track which message is currently streaming
          // When a different message starts, mark the old one as cancelled
          if (res.object === 'delta') {
            if (
              currentStreamingMessageIdRef.current &&
              currentStreamingMessageIdRef.current !== res._id
            ) {
              // A new message started - cancel the old one
              cancelledMessageIdsRef.current.add(
                currentStreamingMessageIdRef.current
              )
            }
            currentStreamingMessageIdRef.current = res._id
          }

          if (res.object === 'delta' && res.content !== undefined) {
            streamBridgeRef.current.onDelta(conversationId, res.content)
          }

          if (res.object === 'done') {
            streamBridgeRef.current.onDone(conversationId)
            currentStreamingMessageIdRef.current = null
          }
        }
      }
    },
    [conversationId]
  )

  // Create adapter with current options
  const adapter = useMemo(
    () =>
      createCozyRealtimeChatAdapter({
        client: client as Parameters<
          typeof createCozyRealtimeChatAdapter
        >[0]['client'],
        conversationId,
        streamBridge: streamBridgeRef.current
      }),
    [client, conversationId]
  )

  // Create runtime with adapter and initial messages
  const runtime = useLocalRuntime(adapter, {
    initialMessages
  })

  // Cleanup on unmount or conversation change
  useEffect(() => {
    return () => {
      streamBridgeRef.current.cleanup(conversationId)
    }
  }, [conversationId])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}

/**
 * Provider that sets up assistant-ui runtime with Cozy's backend.
 * Must be used within a route that provides conversationId param.
 */
const CozyAssistantRuntimeProvider = ({
  children
}: CozyAssistantRuntimeProviderProps) => {
  const { conversationId } = useParams<{ conversationId: string }>()

  if (!conversationId) {
    return null
  }

  return (
    <ConversationLoader conversationId={conversationId}>
      {children}
    </ConversationLoader>
  )
}

export default CozyAssistantRuntimeProvider
