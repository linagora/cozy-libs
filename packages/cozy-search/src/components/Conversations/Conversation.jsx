import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import flag from 'cozy-flags'
import { CircularProgress } from 'cozy-ui/transpiled/react/Progress'

import ChatConversation from './ChatConversation'
import { buildChatConversationQueryById, buildMyselfQuery } from '../queries'
import ConversationBar from './ConversationBar'
import { useAssistant } from '../AssistantProvider'
import ConversationGreetings from './ConversationGreetings'
import ChatModes from './ConversationsChips'

const Conversation = ({ id }) => {
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
    <div className="u-flex-auto u-flex u-flex-column u-flex-items-center u-flex-justify-center">
      {isLoading ? (
        <div className="u-h-100 u-w-100 u-maw-7 u-flex u-flex-column u-flex-items-center u-flex-justify-center">
          <CircularProgress />
        </div>
      ) : (
        <ChatConversation id={id} myself={myselves[0]} />
      )}

      {!hasConversationStarted && <ConversationGreetings />}

      <ConversationBar assistantStatus={assistantState.status} />

      {flag('cozy.assistant.demo') && <ChatModes />}
    </div>
  )
}

export default Conversation
