import { ActionBarPrimitive, useAuiState } from '@assistant-ui/react'
import React from 'react'

import { Check, Copy, Icon, Restore } from '@linagora/twake-icons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useI18n } from 'twake-i18n'

const ICON_SIZE = 16

const AssistantMessageActions = ({ canCopy }) => {
  const { t } = useI18n()

  const isCopied = useAuiState(({ message }) => message.isCopied)
  // The stack keeps a single thread per conversation: regenerating an
  // older answer would drop the following messages on screen only.
  const isLast = useAuiState(({ message }) => message.isLast)

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      className="u-flex u-flex-items-center u-mt-half"
    >
      {canCopy && (
        <ActionBarPrimitive.Copy asChild>
          <IconButton
            size="small"
            aria-label={t(
              isCopied ? 'assistant.actions.copied' : 'assistant.actions.copy'
            )}
          >
            <Icon icon={isCopied ? Check : Copy} size={ICON_SIZE} />
          </IconButton>
        </ActionBarPrimitive.Copy>
      )}
      {isLast && (
        <ActionBarPrimitive.Reload asChild>
          <IconButton size="small" aria-label={t('assistant.actions.reload')}>
            <Icon icon={Restore} size={ICON_SIZE} />
          </IconButton>
        </ActionBarPrimitive.Reload>
      )}
    </ActionBarPrimitive.Root>
  )
}

export default AssistantMessageActions
