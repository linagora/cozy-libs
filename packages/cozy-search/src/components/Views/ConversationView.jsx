import React from 'react'
import { useParams } from 'react-router-dom'

import Conversation from '../Conversations/Conversation'
import ConversationHeader from '../Conversations/ConversationHeader'
import ConversationList from '../Conversations/ConversationList'

const ConversationView = () => {
  const { conversationId } = useParams()

  return (
    <div className="u-h-100 u-flex u-flex-column">
      <ConversationHeader />

      <div className="u-h-100 u-flex u-flex-row u-mih-1 u-flex-grow-1">
        <ConversationList />
        <Conversation id={conversationId} />
      </div>
    </div>
  )
}

export default ConversationView
