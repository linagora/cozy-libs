/**
 * CozyAssistantMessage renders assistant messages in the chat using cozy-ui
 * components integrated with assistant-ui's MessagePrimitive.
 *
 * Features:
 * - TwakeAssistantIcon for the assistant avatar
 * - Markdown rendering via cozy-ui
 * - Sources display from RAG
 * - Action bar with copy and reload buttons using ActionBarPrimitive
 */

import React, { forwardRef } from 'react'

import { useI18n } from 'twake-i18n'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Box from 'cozy-ui/transpiled/react/Box'
import Typography from 'cozy-ui/transpiled/react/Typography'
import Markdown from 'cozy-ui/transpiled/react/Markdown'
import CopyIcon from 'cozy-ui/transpiled/react/Icons/Copy'
import RefreshIcon from 'cozy-ui/transpiled/react/Icons/Refresh'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import {
  MessagePrimitive,
  ActionBarPrimitive,
  useMessageRuntime,
  useMessagePartText,
  useMessage
} from '@assistant-ui/react'

import { TwakeAssistantIcon } from '../AssistantIcon/TwakeAssistantIcon'
import Sources from './Sources/Sources'
import styles from './styles.styl'

interface Source {
  id: string
}

/**
 * Custom Text component that uses cozy-ui's Markdown renderer.
 */
const CozyMarkdownText = () => {
  const textPart = useMessagePartText()

  if (!textPart?.text) return null

  return <Markdown content={textPart.text} />
}

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'data-copied'?: boolean
}

/**
 * Copy button that uses ActionBarPrimitive.Copy with cozy-ui IconButton
 */
const CopyButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ onClick, 'data-copied': dataCopied, ...rest }, ref) => {
    const { t } = useI18n()
    const { showAlert } = useAlert()
    const isCopied = dataCopied ?? false

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Call the original onClick from ActionBarPrimitive.Copy
      if (onClick) {
        onClick(e)
      }
      // Show alert notification
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(showAlert as any)({
        message: t('assistant.actions.copied'),
        severity: 'success'
      })
    }

    return (
      <IconButton
        ref={ref}
        size="small"
        onClick={handleClick}
        title={t('assistant.actions.copy')}
        className="u-mr-half"
        data-testid="copy-button"
        data-copied={dataCopied}
      >
        <Icon icon={isCopied ? CheckIcon : CopyIcon} size={16} />
      </IconButton>
    )
  }
)
CopyButton.displayName = 'CopyButton'

/**
 * Reload button that uses ActionBarPrimitive.Reload with cozy-ui IconButton
 */
const ReloadButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...rest }, ref) => {
  const { t } = useI18n()

  return (
    <IconButton
      ref={ref}
      size="small"
      onClick={onClick}
      title={t('assistant.actions.reload')}
      data-testid="reload-button"
    >
      <Icon icon={RefreshIcon} size={16} />
    </IconButton>
  )
})
ReloadButton.displayName = 'ReloadButton'

/**
 * Action bar with copy and reload buttons using ActionBarPrimitive
 */
const CozyActionBar = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="u-flex u-mt-half"
      data-testid="action-bar"
    >
      <ActionBarPrimitive.Copy asChild copiedDuration={2000}>
        <CopyButton />
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <ReloadButton />
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  )
}

const CozyAssistantMessage = () => {
  const { t } = useI18n()
  const messageRuntime = useMessageRuntime()
  const state = messageRuntime.getState()

  // Extract sources from message metadata
  const sources = (state.metadata?.custom?.sources as Source[] | undefined) || []
  const messageId = state.id

  return (
    <MessagePrimitive.Root className="u-mt-1-half">
      <Box display="flex" alignItems="center" gridGap={12}>
        <Icon
          icon={TwakeAssistantIcon}
          size={24}
          className="u-mh-half"
          color="var(--primaryColor)"
        />
        <Typography variant="h6" display="inline">
          {t('assistant.name')}
        </Typography>
      </Box>
      <Box pl="44px" className={styles['cozyThread-messageContent']}>
        <MessagePrimitive.Content
          components={{
            Text: CozyMarkdownText
          }}
        />
        <CozyActionBar />
      </Box>
      {sources.length > 0 && <Sources messageId={messageId} sources={sources} />}
    </MessagePrimitive.Root>
  )
}

export default CozyAssistantMessage
