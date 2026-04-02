import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useThreadRuntime,
  useComposer
} from '@assistant-ui/react'
import cx from 'classnames'
import React, { useCallback } from 'react'

import flag from 'cozy-flags'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import FileChipsList from './FileChipsList'
import { useFileMention } from './FileMentionContext'
import AssistantSelection from '../Assistant/AssistantSelection'
import { useAssistant } from '../AssistantProvider'
import TwakeKnowledgeSelector from '../TwakeKnowledges/TwakeKnowledgeSelector'

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const composerRuntime = useComposerRuntime()
  const threadRuntime = useThreadRuntime()
  const isRunning = useThread(state => state.isRunning)
  const isThreadEmpty = useThread(state => state.messages.length === 0)
  const { setOpenedKnowledgePanel } = useAssistant()
  const {
    selectedFiles,
    reset: resetFileMention,
    snapshotAttachmentsIDs
  } = useFileMention()

  const value = useComposer(state => state.text)
  const isEmpty = useComposer(state => state.isEmpty)

  const handleSend = useCallback(() => {
    if (isEmpty || isRunning) return
    const text = composerRuntime.getState().text
    const attachmentIDs = selectedFiles.map(f => f.id)
    snapshotAttachmentsIDs()
    const metadata =
      attachmentIDs.length > 0 ? { custom: { attachmentIDs } } : undefined
    threadRuntime.append({
      content: [{ type: 'text', text }],
      metadata
    })
    composerRuntime.setText('')
    resetFileMention()
  }, [
    composerRuntime,
    threadRuntime,
    selectedFiles,
    resetFileMention,
    snapshotAttachmentsIDs,
    isEmpty,
    isRunning
  ])

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
    <ComposerPrimitive.Root
      className={cx('u-w-100 u-maw-7 u-mh-auto', {
        'u-card u-bxz u-elevation-1': isMobile
      })}
    >
      <ConversationBar
        elevation={isMobile ? 0 : 1}
        disabledHover={!!isMobile}
        value={value}
        isEmpty={isEmpty}
        isRunning={isRunning}
        onKeyDown={handleKeyDown}
        onCancel={handleCancel}
        onSend={handleSend}
        composerRuntime={composerRuntime}
      />

      <FileChipsList />

      <div className="u-flex u-flex-items-center u-flex-justify-between u-mt-1">
        {flag('cozy.assistant.create-assistant.enabled') && (
          <AssistantSelection disabled={!isThreadEmpty} />
        )}
        {flag('cozy.assistant.source-knowledge.enabled') && (
          <TwakeKnowledgeSelector
            onSelectTwakeKnowledge={setOpenedKnowledgePanel}
          />
        )}
      </div>
    </ComposerPrimitive.Root>
  )
}

export default ConversationComposer
