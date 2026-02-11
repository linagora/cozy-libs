import React from 'react'

import Conversation from '../Conversations/Conversation'
import CozyAssistantRuntimeProvider from '../CozyAssistantRuntimeProvider'

const AssistantContainer = () => {
  return (
    <div className="u-flex u-ov-hidden u-h-100">
      <div className="u-flex-auto u-flex u-flex-column u-pb-1 u-ov-hidden">
        <CozyAssistantRuntimeProvider>
          <Conversation />
        </CozyAssistantRuntimeProvider>
      </div>
    </div>
  )
}

export default AssistantContainer
