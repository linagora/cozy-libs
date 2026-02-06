import React from 'react'

import flag from 'cozy-flags'
import Divider from 'cozy-ui/transpiled/react/Divider'

import { useAssistant } from '../AssistantProvider'
import PrettyScrollbar from '../Containers/PrettyScrollbar'
import Conversation from '../Conversations/Conversation'
import CozyAssistantRuntimeProvider from '../CozyAssistantRuntimeProvider'
import SearchConversation from '../Search/SearchConversation'
import Sidebar from '../Sidebar'
import TwakeKnowledgePanel from '../TwakeKnowledges/TwakeKnowledgePanel'

const AssistantContainer = () => {
  const {
    isOpenSearchConversation,
    openedKnowledgePanel,
    setOpenedKnowledgePanel
  } = useAssistant()

  return (
    <div className="u-flex u-ov-hidden u-h-100">
      <Sidebar className="u-w-5 u-pb-1 u-bg-white" />

      <Divider orientation="vertical" flexItem />

      <PrettyScrollbar className="u-flex-auto u-flex u-flex-column u-pb-1 u-ov-hidden u-bg-white">
        {isOpenSearchConversation &&
        flag('cozy.search-conversation.enabled') ? (
          <SearchConversation />
        ) : (
          <CozyAssistantRuntimeProvider>
            <Conversation />
          </CozyAssistantRuntimeProvider>
        )}
      </PrettyScrollbar>

      {openedKnowledgePanel && flag('cozy.source-knowledge.enabled') && (
        <div className="u-ml-half u-h-100 u-maw-7">
          <TwakeKnowledgePanel
            onClose={() => setOpenedKnowledgePanel(undefined)}
          />
        </div>
      )}
    </div>
  )
}

export default AssistantContainer
