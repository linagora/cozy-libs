import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useComposer
} from '@assistant-ui/react'
import React, { useCallback } from 'react'

import flag from 'cozy-flags'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import AssistantSelection from '../Assistant/AssistantSelection'
import { useAssistant } from '../AssistantProvider'
import TwakeKnowledgeSelector from '../TwakeKnowledges/TwakeKnowledgeSelector'

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)
  const { setOpenedKnowledgePanel } = useAssistant()

  const value = useComposer(state => state.text)
  const isEmpty = useComposer(state => state.isEmpty)

  const handleSend = useCallback(() => {
    composerRuntime.send()
  }, [composerRuntime])

  const handleCancel = useCallback(() => {
    composerRuntime.cancel()
  }, [composerRuntime])

  const handleKeyDown = useCallback(
    ev => {
      if (!isMobile) {
        if (ev.shiftKey && ev.key === 'Enter') {
          return
        }

        if (ev.key === 'Enter') {
          ev.preventDefault()
          handleSend()
        }
      }
    },
    [isMobile, handleSend]
  )

  return (
    <ComposerPrimitive.Root className="u-w-100 u-maw-7 u-mh-auto">
      <ConversationBar
        value={value}
        isEmpty={isEmpty}
        isRunning={isRunning}
        onKeyDown={handleKeyDown}
        onCancel={handleCancel}
        onSend={handleSend}
      />

      <div className="u-flex u-flex-items-center u-flex-justify-between u-mt-1">
        {flag('cozy.create-assistant.enabled') && <AssistantSelection />}
        <TwakeKnowledgeSelector
          onSelectTwakeKnowledge={setOpenedKnowledgePanel}
        />
      </div>
    </ComposerPrimitive.Root>
  )
}

export default ConversationComposer
