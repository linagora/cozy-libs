import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useComposer
} from '@assistant-ui/react'
import { Icon, Paperplane, Stop } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useCallback } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import styles from './styles.styl'
import { useChatComponents } from '../../contexts/ChatComponentsContext'

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)
  const isThreadEmpty = useThread(state => state.messages.length === 0)
  const { ComposerExtras } = useChatComponents()

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
    <ComposerPrimitive.Root
      className={cx(
        'u-w-100 u-maw-7 u-mh-auto u-bxz',
        styles['composerContainer']
      )}
    >
      <div className="u-flex u-flex-items-start u-flex-justify-between">
        <ConversationBar
          value={value}
          isEmpty={isEmpty}
          onKeyDown={handleKeyDown}
        />
        <div className="u-flex u-flex-items-center u-flex-shrink-0">
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
                  label: <Icon icon={Paperplane} size={12} rotate={-45} />,
                  onClick: handleSend
                })}
          />
        </div>
      </div>

      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-between',
          styles['composerActions']
        )}
      >
        <ComposerExtras disabled={!isThreadEmpty} />
      </div>
    </ComposerPrimitive.Root>
  )
}

export default ConversationComposer
