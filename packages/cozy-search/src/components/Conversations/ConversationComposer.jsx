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

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)

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

      {flag('cozy.create-assistant.enabled') && (
        <AssistantSelection className="u-w-100 u-maw-7 u-mt-1" />
      )}
    </ComposerPrimitive.Root>
  )
}

export default ConversationComposer
