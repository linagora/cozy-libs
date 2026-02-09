import cx from 'classnames'
import React from 'react'

import Divider from 'cozy-ui/transpiled/react/Divider'

import { useAssistant } from '../AssistantProvider'
import styles from './styles.styl'
import Conversation from '../Conversations/Conversation'
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
    <div
      className={cx(
        'u-flex u-ov-hidden u-h-100',
        styles['assistant-container']
      )}
    >
      <div className={cx('u-maw-5 u-pb-1 u-bg-white')}>
        <Sidebar />
      </div>

      <Divider orientation="vertical" flexItem />

      <div className="u-flex-auto u-flex u-flex-column u-pb-1 u-ov-hidden u-bg-white">
        {isOpenSearchConversation ? <SearchConversation /> : <Conversation />}
      </div>

      {openedKnowledgePanel && (
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
