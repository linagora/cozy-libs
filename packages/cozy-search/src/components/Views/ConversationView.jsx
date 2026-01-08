import React from 'react'
import { useParams } from 'react-router-dom'

import { useAssistant } from '../AssistantProvider'
import Conversation from '../Conversations/Conversation'
import ConversationList from '../Conversations/ConversationList'
import SearchConversation from '../Conversations/SearchConversation'
import TwakeKnowledgePanel from '../TwakeKnowledge'

const ConversationView = () => {
  const { conversationId } = useParams()
  const {
    setIsOpenCreateAssistant,
    openedKnowledgePanel,
    setOpenedKnowledgePanel,
    isOpenSearchConversation
  } = useAssistant()

  return (
    <div className="u-h-100 u-flex u-flex-row">
      <ConversationList />

      <div className="u-h-100 u-w-100 u-flex u-mih-1">
        {isOpenSearchConversation ? (
          <SearchConversation />
        ) : (
          <Conversation
            id={conversationId}
            onCreateAssistant={() => setIsOpenCreateAssistant(true)}
            onSelectTwakeKnowledge={setOpenedKnowledgePanel}
          />
        )}
      </div>

      {openedKnowledgePanel && (
        <div className="u-ml-half u-h-100 u-w-7">
          <TwakeKnowledgePanel
            onClose={() => setOpenedKnowledgePanel(undefined)}
          />
        </div>
      )}
    </div>
  )
}

export default ConversationView
