import { MessagePrimitive, useMessage } from '@assistant-ui/react'
import React from 'react'

import Alert from 'cozy-ui/transpiled/react/Alert'
import Box from 'cozy-ui/transpiled/react/Box'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import MarkdownText from './MarkdownText'
import { TwakeAssistantIcon } from '../AssistantIcon/TwakeAssistantIcon'
import Sources from '../Conversations/Sources/Sources'

const useIsErrorMessage = () => {
  const { t } = useI18n()
  const content = useMessage(s => s.content)
  const firstText = content?.find(part => part.type === 'text')
  return firstText?.type === 'text' && firstText.text === t('assistant.default_error')
}

const AssistantMessage = () => {
  const { t } = useI18n()

  const isThinking = useMessage(s => s.status?.type === 'requires-action')
  const isError = useIsErrorMessage()
  const messageId = useMessage(s => s.id)
  const sources = useMessage(s => s.metadata?.custom?.sources)

  return (
    <MessagePrimitive.Root className="u-mt-1-half u-mr-3">
      {isThinking && (
        <Box display="flex" alignItems="center" gridGap={12}>
          <Icon
            icon={TwakeAssistantIcon}
            size={24}
            className="u-mh-half"
            color="var(--primaryColor)"
          />
          <Typography variant="h6" display="inline">
            {t('assistant.message.running')}
          </Typography>
        </Box>
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
