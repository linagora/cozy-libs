import { useComposerRuntime, useThread } from '@assistant-ui/react'
import React from 'react'

import { Icon, ArrowUp, Stop } from '@linagora/twake-icons'
import Button from 'cozy-ui/transpiled/react/Buttons'

export const ConversationSendButton = () => {
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)

  const handleSend = () => {
    composerRuntime.send()
  }

  const handleCancel = () => {
    composerRuntime.cancel()
  }

  return (
    <Button
      size="small"
      className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle u-flex-shrink-0"
      classes={{ label: 'u-flex u-w-auto' }}
      label={
        isRunning ? (
          <Icon icon={Stop} size={12} />
        ) : (
          <Icon icon={ArrowUp} size={16} />
        )
      }
      onClick={isRunning ? handleCancel : handleSend}
    />
  )
}
