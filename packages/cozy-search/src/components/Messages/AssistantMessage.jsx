import { MessagePrimitive, useMessage } from '@assistant-ui/react'
import React from 'react'
import { useI18n } from 'twake-i18n'

import Box from 'cozy-ui/transpiled/react/Box'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'

import MarkdownText from './MarkdownText'
import { TwakeAssistantIcon } from '../AssistantIcon/TwakeAssistantIcon'

const AssistantMessage = () => {
  const { t } = useI18n()

  const isRunning = useMessage(s => s.status?.type === 'running')

  return (
    <MessagePrimitive.Root className="u-mt-1-half u-mr-3">
      {isRunning && (
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
      <MessagePrimitive.Content
        components={{
          Text: MarkdownText
        }}
      />
    </MessagePrimitive.Root>
  )
}

export default AssistantMessage
