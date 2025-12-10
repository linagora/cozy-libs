import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'

import ChatConversation from './ChatConversation'
import { buildMyselfQuery } from '../queries'
import ConversationBar from './ConversationBar'
import { useAssistant } from '../AssistantProvider'

const Conversation = ({ id }) => {
  const { assistantState } = useAssistant()

  const myselfQuery = buildMyselfQuery()
  const { data: myselves, ...queryMyselfResult } = useQuery(
    myselfQuery.definition,
    myselfQuery.options
  )

  const isLoading = isQueryLoading(queryMyselfResult)

  if (isLoading) return null

  return (
    <div className="u-flex-auto u-flex u-flex-column u-flex-items-center u-flex-justify-center">
      <ChatConversation id={id} myself={myselves[0]} />
      <ConversationBar assistantStatus={assistantState.status} />
    </div>
  )
}

export default Conversation
