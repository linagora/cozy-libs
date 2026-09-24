import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useComposer
} from '@assistant-ui/react'
import cx from 'classnames'
import React, { useCallback } from 'react'

import { Icon, ArrowUp, Stop } from '@linagora/twake-icons'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import styles from './styles.styl'
import AssistantSelection from '../Assistant/AssistantSelection'
import { useAssistant } from '../AssistantProvider'
import TwakeKnowledgeSelector from '../TwakeKnowledges/TwakeKnowledgeSelector'

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)
  const isThreadEmpty = useThread(state => state.messages.length === 0)
  const { websearchEnabled, setWebsearchEnabled } = useAssistant()

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

  const handleToggleWebsearch = useCallback(() => {
    if (isRunning) return
    setWebsearchEnabled(prev => !prev)
  }, [isRunning, setWebsearchEnabled])

  const sendButton = (
    <Button
      size="small"
      className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle u-flex-shrink-0"
      classes={{ label: 'u-flex u-w-auto' }}
      {...(isRunning
        ? {
            label: <Icon icon={Stop} size={12} />,
            onClick: handleCancel
          }
        : {
            variant: 'primary',
            label: <Icon icon={ArrowUp} size={16} />,
            onClick: handleSend
          })}
    />
  )

  // On mobile the send button sits by the text, the sources are icons and
  // the assistant chip picks the assistant; on desktop the send button ends
  // the chips row and the assistant is picked from the sidebar.
  return (
    <ComposerPrimitive.Root
      className={cx(
        'u-w-100 u-maw-7 u-mh-auto u-bxz',
        styles['composerContainer'],
        { [styles['composerContainer--mobile']]: isMobile }
      )}
    >
      <div className="u-flex u-flex-items-start u-flex-justify-between">
        <ConversationBar
          value={value}
          isEmpty={isEmpty}
          onKeyDown={handleKeyDown}
        />
        {isMobile && (
          <div className="u-flex u-flex-items-center u-flex-shrink-0">
            {sendButton}
          </div>
        )}
      </div>

      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-between',
          styles['composerActions']
        )}
      >
        <div className="u-flex u-flex-items-center u-flex-wrap">
          {flag('cozy.assistant.create-assistant.enabled') && (
            <AssistantSelection
              disabled={!isThreadEmpty}
              selectable={isMobile}
              borderless={isMobile}
              className="u-mr-half"
            />
          )}
          {!isMobile && (
            <TwakeKnowledgeSelector
              websearchEnabled={websearchEnabled}
              onToggleWebsearch={handleToggleWebsearch}
            />
          )}
        </div>
        {isMobile ? (
          <TwakeKnowledgeSelector
            className="u-ml-auto"
            websearchEnabled={websearchEnabled}
            onToggleWebsearch={handleToggleWebsearch}
          />
        ) : (
          sendButton
        )}
      </div>
    </ComposerPrimitive.Root>
  )
}

export default ConversationComposer
