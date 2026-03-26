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

import { useClient, useQuery, isQueryLoading } from 'cozy-client'
import Minilog from 'cozy-minilog'
import useRealtime from 'cozy-realtime/dist/useRealtime'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { useAssistant } from './AssistantProvider'
import {
  FileMentionProvider,
  useFileMention
} from './Conversations/FileMentionContext'
import { createCozyRealtimeChatAdapter } from './adapters/CozyRealtimeChatAdapter'
import { StreamBridge } from './adapters/StreamBridge'
import { DEFAULT_ASSISTANT } from './constants'
import { sanitizeChatContent } from './helpers'
import {
  CHAT_EVENTS_DOCTYPE,
  CHAT_CONVERSATIONS_DOCTYPE,
  buildChatConversationQueryById
} from './queries'

const log = Minilog('🔍 [CozyAssistantRuntimeProvider]')

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ id: string; doctype?: string }>
}

interface Conversation {
  _id: string
  messages?: ConversationMessage[]
  relationships?: {
    assistant?: {
      data: {
        _id: string
      }
    }
  }
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
    role: msg.role,
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
  const { setSelectedAssistantId } = useAssistant()
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

  useEffect(() => {
    setSelectedAssistantId(
      conversation?.relationships?.assistant?.data?._id || DEFAULT_ASSISTANT._id
    )
  }, [
    conversation?.relationships?.assistant?.data?._id,
    setSelectedAssistantId
  ])

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

const FileMentionAwareRuntimeProvider = ({
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
  const { selectedAssistantId } = useAssistant()
  const { getAttachmentsIDs } = useFileMention()

  useEffect(() => {
    messagesIdRef.current = initialMessages
      .map(m => m.id)
      .filter((id): id is string => !!id)
  }, [initialMessages])

  useEffect(() => {
    streamBridgeRef.current.setCleanupCallback(() => {
      try {
        if (currentStreamingMessageIdRef.current) {
          cancelledMessageIdsRef.current.add(
            currentStreamingMessageIdRef.current
          )
          currentStreamingMessageIdRef.current = null
        }
      } catch (error) {
        log.error('Error during StreamBridge cleanup callback:', error)
      }
    })
  }, [])

  const handleConversationChange = useCallback(
    (res: Conversation) => {
      try {
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
      } catch (error) {
        log.error('Error handling conversation change:', error)
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
        created: (
          res:
            | {
                _id: string
                object: 'delta'
                position?: number
                content: string
              }
            | { _id: string; object: 'done' }
            | { _id: string; object: 'generated' }
            | {
                _id: string
                object: 'sources'
                content: Array<{ id: string; doctype?: string }>
              }
            | { _id: string; object: 'error'; message: string }
        ) => {
          if (cancelledMessageIdsRef.current.has(res._id)) {
            if (res.object === 'done' || res.object === 'error') {
              cancelledMessageIdsRef.current.delete(res._id)
            }
            return
          }

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

          try {
            if (res.object === 'delta' && res.content !== undefined) {
              streamBridgeRef.current.onDelta(
                conversationId,
                res.content,
                res.position
              )
            }

            if (res.object === 'sources') {
              streamBridgeRef.current.onSources(conversationId, res.content)
            }

            if (res.object === 'done') {
              streamBridgeRef.current.onDone(conversationId)
              currentStreamingMessageIdRef.current = null
            }

            if (res.object === 'error') {
              log.error('LLM error:', res.message)
              streamBridgeRef.current.onError(
                conversationId,
                new Error('LLM error')
              )
              currentStreamingMessageIdRef.current = null
            }
          } catch (error) {
            log.error('Error handling chat real-time event:', error)
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
          // eslint-disable-next-line react-hooks/refs
          streamBridge: streamBridgeRef.current,
          assistantId: selectedAssistantId,
          getAttachmentsIDs
        },
        t
      ),
    [client, conversationId, selectedAssistantId, t, getAttachmentsIDs]
  )

  const runtime = useLocalRuntime(adapter, {
    initialMessages
  })

  useEffect(() => {
    const streamBridge = streamBridgeRef.current
    return (): void => {
      try {
        streamBridge.cleanup(conversationId)
      } catch (error) {
        log.error('Error cleaning up StreamBridge on unmount:', error)
      }
    }
  }, [conversationId])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
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
  return (
    <FileMentionProvider>
      <FileMentionAwareRuntimeProvider
        conversationId={conversationId}
        initialMessages={initialMessages}
      >
        {children}
      </FileMentionAwareRuntimeProvider>
    </FileMentionProvider>
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

class CozyAssistantErrorBoundary extends React.Component<
  { children: ReactNode; t: (key: string) => string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; t: (key: string) => string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): {
    hasError: boolean
    error: Error
  } {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    log.error('Assistant Runtime UI crashed:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="u-flex u-flex-column u-flex-items-center u-flex-justify-center u-h-100 u-w-100 u-ta-center">
          <Typography variant="h4" className="u-mb-1" color="error">
            {this.props.t('assistant.default_error')}
          </Typography>
          <Button
            label={this.props.t('assistant.actions.reload')}
            onClick={this.handleRetry}
            variant="secondary"
          />
        </div>
      )
    }

    return this.props.children
  }
}

const CozyAssistantRuntimeProviderWithErrorBoundary = (
  props: CozyAssistantRuntimeProviderProps
): JSX.Element | null => {
  const { t } = useI18n()
  return (
    <CozyAssistantErrorBoundary t={t}>
      <CozyAssistantRuntimeProvider {...props} />
    </CozyAssistantErrorBoundary>
  )
}

export default CozyAssistantRuntimeProviderWithErrorBoundary
