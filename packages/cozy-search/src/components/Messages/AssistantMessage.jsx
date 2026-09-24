import { MessagePrimitive, useMessage } from '@assistant-ui/react'
import React from 'react'

import Alert from 'cozy-ui/transpiled/react/Alert'
import { useI18n } from 'twake-i18n'

import MarkdownText from './MarkdownText'
import styles from './styles.styl'
import Sources from '../Conversations/Sources/Sources'

const useIsErrorMessage = () => {
  return useMessage(s => s.metadata?.custom?.isError === true)
}

const AssistantMessage = () => {
  const { t } = useI18n()

  const isThinking = useMessage(s => s.status?.type === 'requires-action')
  const isError = useIsErrorMessage()
  const messageId = useMessage(s => s.id)
  const sources = useMessage(s => s.metadata?.custom?.sources)

  return (
    <MessagePrimitive.Root className="u-mt-1-half">
      {isThinking && (
        // Three dots bouncing one after the other while the answer is
        // awaited (the design's "icon animation"); the label is for
        // screen readers only.
        <div
          role="status"
          aria-label={t('assistant.message.running')}
          className={styles['thinking-dots']}
        >
          <span className={styles['thinking-dot']} />
          <span className={styles['thinking-dot']} />
          <span className={styles['thinking-dot']} />
        </div>
      )}
      {isError ? (
        <Alert severity="error">{t('assistant.default_error')}</Alert>
      ) : (
        <MessagePrimitive.Content
          components={{
            Text: MarkdownText
          }}
        />
      )}
      {sources?.length > 0 && (
        <Sources messageId={messageId} sources={sources} />
      )}
    </MessagePrimitive.Root>
  )
}

export default AssistantMessage
