import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import { CircularProgress } from 'cozy-ui/transpiled/react/Progress'

import ChatConversation from './ChatConversation'
import { useAssistant } from '../AssistantProvider'
import { buildChatConversationQueryById, buildMyselfQuery } from '../queries'
import ChatModes from './ChatModes'
import ConversationBar from './ConversationBar'
import ConversationGreetings from './ConversationGreetings'
import styles from './styles.styl'

const Conversation = ({ id, onCreateAssistant, onSelectTwakeKnowledge }) => {
  const { assistantState } = useAssistant()

  const myselfQuery = buildMyselfQuery()
  const { data: myselves, ...queryMyselfResult } = useQuery(
    myselfQuery.definition,
    myselfQuery.options
  )

  const chatConversationQuery = buildChatConversationQueryById(id)
  const { data: chatConversation, ...queryConversationResult } = useQuery(
    chatConversationQuery.definition,
    chatConversationQuery.options
  )

  const hasConversationStarted =
    isQueryLoading(queryConversationResult) ||
    (chatConversation && chatConversation.messages.length > 0)

  const isLoading =
    isQueryLoading(queryMyselfResult) || isQueryLoading(queryConversationResult)

  return (
    <div
      className={`u-flex-auto u-flex u-flex-column u-flex-items-center u-flex-justify-center ${styles['conversation-container']}`}
    >
      {isLoading ? (
        <div className="u-h-100 u-w-100 u-maw-7 u-flex u-flex-column u-flex-items-center u-flex-justify-center">
          <CircularProgress />
        </div>
      ) : (
        <ChatConversation id={id} myself={myselves[0]} />
      )}

      {!hasConversationStarted && <ConversationGreetings />}

      <ConversationBar assistantStatus={assistantState.status} />

      <ChatModes
        onCreateAssistant={onCreateAssistant}
        onSelectTwakeKnowledge={onSelectTwakeKnowledge}
      />
    </div>
  )
}

export default Conversation
