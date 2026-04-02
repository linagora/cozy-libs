import { MessagePrimitive, useMessage } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'

import UserMessageAttachments from './UserMessageAttachments'
import styles from './styles.styl'

const UserMessage = () => {
  const { type: theme } = useCozyTheme()
  const attachmentIDs = useMessage(s => s.metadata?.custom?.attachmentIDs)

  return (
    <MessagePrimitive.Root className="u-mt-1">
      <Box
        display="block"
        border={0}
        borderRadius={10}
        padding={0.5}
        className={cx(
          'u-ml-auto',
          styles['cozyThread-user-messages'],
          styles[`cozyThread-user-messages--${theme}`]
        )}
      >
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => <Typography>{text}</Typography>
          }}
        />
        {attachmentIDs?.length > 0 && (
          <UserMessageAttachments attachmentIDs={attachmentIDs} />
        )}
      </Box>
    </MessagePrimitive.Root>
  )
}

export default UserMessage
