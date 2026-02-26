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

import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react'
import type { ThreadMessageLike } from '@assistant-ui/react'
import React, {
  useMemo,
  useRef,
  useEffect,
  ReactNode,
  useCallback
} from 'react'
import { useParams } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import { useClient, useQuery, isQueryLoading } from 'cozy-client'
import useRealtime from 'cozy-realtime/dist/useRealtime'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { createCozyRealtimeChatAdapter } from './adapters/CozyRealtimeChatAdapter'
import { StreamBridge } from './adapters/StreamBridge'
import { sanitizeChatContent } from './helpers'
import {
  CHAT_EVENTS_DOCTYPE,
  CHAT_CONVERSATIONS_DOCTYPE,
  buildChatConversationQueryById
} from './queries'

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

const ConversationLoader = ({
  children,
  conversationId
}: CozyAssistantRuntimeProviderProps & {
  conversationId: string
}): JSX.Element | null => {
  const conversationQuery = buildChatConversationQueryById(conversationId)
  const queryResult = useQuery(
    conversationQuery.definition,
    conversationQuery.options
  ) as { data: Conversation | undefined; fetchStatus: string }
  const conversation = queryResult.data
  const isLoading = isQueryLoading(queryResult)

  const initialMessages = useMemo(
    () => convertMessagesToThreadMessages(conversation?.messages),
    [conversation?.messages]
  )

  if (isLoading) {
    return (
      <div className="u-flex u-flex-items-center u-flex-justify-center u-h-100 u-w-100">
        <Spinner size="xxlarge" />
      </div>
    )
  }

  return (
    <CozyAssistantRuntimeProviderInner
      key={conversationId}
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
}): JSX.Element => {
  const { t } = useI18n()
  const client = useClient()
  const streamBridgeRef = useRef(new StreamBridge())
  const messagesIdRef = useRef<string[]>([])
  const cancelledMessageIdsRef = useRef<Set<string>>(new Set())
  const currentStreamingMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    messagesIdRef.current = initialMessages
      .map(m => m.id)
      .filter((id): id is string => !!id)
  }, [initialMessages])

  useEffect(() => {
    streamBridgeRef.current.setCleanupCallback(() => {
      if (currentStreamingMessageIdRef.current) {
        cancelledMessageIdsRef.current.add(currentStreamingMessageIdRef.current)
        currentStreamingMessageIdRef.current = null
      }
    })
  }, [])

  const handleConversationChange = useCallback(
    (res: Conversation) => {
      if (res._id === conversationId && res.messages) {
        const newIds = res.messages.map(m => m.id)
        const lastAssistantMsg = res.messages
          .filter(m => m.role === 'assistant')
          .pop()
        if (
          lastAssistantMsg &&
          !messagesIdRef.current.includes(lastAssistantMsg.id)
        ) {
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
    [conversationId]
  )

  useRealtime(
    client,
    {
      [CHAT_CONVERSATIONS_DOCTYPE]: {
        created: handleConversationChange,
        updated: handleConversationChange
      }
    },
    [conversationId]
  )

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

  const adapter = useMemo(
    () =>
      createCozyRealtimeChatAdapter(
        {
          client: client as Parameters<
            typeof createCozyRealtimeChatAdapter
          >[0]['client'],
          conversationId,
          streamBridge: streamBridgeRef.current
        },
        t
      ),
    [client, conversationId, t]
  )

  const runtime = useLocalRuntime(adapter, {
    initialMessages
  })

  useEffect(() => {
    const streamBridge = streamBridgeRef.current
    return () => {
      streamBridge.cleanup(conversationId)
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
}: CozyAssistantRuntimeProviderProps): JSX.Element | null => {
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
