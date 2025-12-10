import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import flag from 'cozy-flags'

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

  const isLoading = isQueryLoading(queryMyselfResult)

  const chatConversationQuery = buildChatConversationQueryById(id)
  const { data: chatConversation } = useQuery(
    chatConversationQuery.definition,
    chatConversationQuery.options
  )

  const hasConversationStarted =
    chatConversation && chatConversation.messages.length > 0

  if (isLoading) return null

  return (
    <div className="u-flex-auto u-flex u-flex-column u-flex-items-center u-flex-justify-center">
      <ChatConversation id={id} myself={myselves[0]} />

      {!hasConversationStarted && <ConversationGreetings />}

      <ConversationBar assistantStatus={assistantState.status} />

      {flag('cozy.assistant.demo') && <ChatModes />}
    </div>
  )
}

export default Conversation
