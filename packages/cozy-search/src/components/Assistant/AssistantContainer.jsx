import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'

import { useAssistant } from '../AssistantProvider'
import styles from './styles.styl'
import PrettyScrollbar from '../Containers/PrettyScrollbar'
import Conversation from '../Conversations/Conversation'
import CozyAssistantRuntimeProviderWithErrorBoundary from '../CozyAssistantRuntimeProvider'
import SearchConversation from '../Search/SearchConversation'
import Sidebar from '../Sidebar'
import TwakeKnowledgePanel from '../TwakeKnowledges/TwakeKnowledgePanel'

const AssistantContainer = () => {
  const {
    isOpenSearchConversation,
    openedKnowledgePanel,
    setOpenedKnowledgePanel
  } = useAssistant()
  const { type: theme } = useCozyTheme()

  return (
    <div
      className={cx(
        'u-flex u-ov-hidden u-h-100',
        styles['assistant-container']
      )}
    >
      <Sidebar className="u-w-5 u-pb-0-t u-pb-1" />

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

      {openedKnowledgePanel &&
        flag('cozy.assistant.source-knowledge.enabled') && (
          <div
            className={cx(
              'u-h-100 u-maw-7 u-pl-half',
              styles[`knowledge-panel--${theme}`]
            )}
          >
            <TwakeKnowledgePanel
              onClose={() => setOpenedKnowledgePanel(undefined)}
            />
          </div>
        )}
    </div>
  )
}

export default AssistantContainer
