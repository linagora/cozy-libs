import cx from 'classnames'
import React from 'react'

import Divider from 'cozy-ui/transpiled/react/Divider'

import { useAssistant } from '../AssistantProvider'
import Conversation from '../Conversations/Conversation'
import SearchConversation from '../Search/SearchConversation'
import Sidebar from '../Sidebar'

const AssistantContainer = () => {
  const { isOpenSearchConversation } = useAssistant()

  return (
    <div className="u-flex u-ov-hidden u-h-100">
      <div className={cx('u-transition-width u-maw-5 u-pb-1')}>
        <Sidebar />
      </div>

      <Divider orientation="vertical" flexItem />

      <div className="u-flex-auto u-flex u-flex-column u-pb-1 u-ov-hidden">
        {isOpenSearchConversation ? <SearchConversation /> : <Conversation />}
      </div>
    </div>
  )
}

export default AssistantContainer
