import React from 'react'
import { useParams } from 'react-router-dom'

import { useAssistant } from '../AssistantProvider'
import Conversation from '../Conversations/Conversation'
import ConversationHeader from '../Conversations/ConversationHeader'
import ConversationList from '../Conversations/ConversationList'

const ConversationView = () => {
  const { conversationId } = useParams()
  const { setIsOpenCreateAssistant } = useAssistant()

  return (
    <div className="u-h-100 u-flex u-flex-column">
      <ConversationHeader />

      <div className="u-h-100 u-flex u-flex-row u-mih-1 u-flex-grow-1">
        <ConversationList />
        <Conversation
          id={conversationId}
          onCreateAssistant={() => setIsOpenCreateAssistant(true)}
        />
      </div>
    </div>
  )
}

export default ConversationView
