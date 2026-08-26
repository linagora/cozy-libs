import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'

import styles from './styles.styl'
import { useChatUIState } from '../../contexts/ChatUIStateContext'
import PrettyScrollbar from '../Containers/PrettyScrollbar'
import Conversation from '../Conversations/Conversation'
import CozyAssistantRuntimeProviderWithErrorBoundary from '../CozyAssistantRuntimeProvider'
import SearchConversation from '../Search/SearchConversation'
import Sidebar from '../Sidebar'

const AssistantContainer = () => {
  const { isOpenSearchConversation } = useChatUIState()

  return (
    <div
      className={cx(
        'u-flex u-ov-hidden u-h-100',
        styles['assistant-container']
      )}
    >
      <Sidebar className="u-pb-0-t u-pb-1" />

      <PrettyScrollbar className="u-flex-auto u-flex u-flex-column u-pb-0-t u-pb-1 u-ov-hidden">
        {isOpenSearchConversation &&
        flag('cozy.assistant.search-conversation.enabled') ? (
          <SearchConversation />
        ) : (
          <CozyAssistantRuntimeProviderWithErrorBoundary>
            <Conversation />
          </CozyAssistantRuntimeProviderWithErrorBoundary>
        )}
      </PrettyScrollbar>
    </div>
  )
}

export default AssistantContainer
