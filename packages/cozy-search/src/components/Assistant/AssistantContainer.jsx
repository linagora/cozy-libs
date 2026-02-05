import React from 'react'

import { useAssistant } from '../AssistantProvider'
import Conversation from '../Conversations/Conversation'
import SearchConversation from '../Search/SearchConversation'

const AssistantContainer = () => {
  const { isOpenSearchConversation } = useAssistant()

  return (
    <div className="u-flex u-ov-hidden u-h-100">
      <div className="u-flex-auto u-flex u-flex-column u-pb-1 u-ov-hidden">
        {isOpenSearchConversation ? <SearchConversation /> : <Conversation />}
      </div>
    </div>
  )
}

export default AssistantContainer
