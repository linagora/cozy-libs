import { MessagePrimitive } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'

const UserMessage = () => {
  return (
    <MessagePrimitive.Root className="u-mt-1">
      <Box
        className={cx(
          'u-ml-auto u-pv-1 u-ph-1-half',
          styles['cozyThread-user-messages']
        )}
      >
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => <Typography>{text}</Typography>
          }}
        />
      </Box>
    </MessagePrimitive.Root>
  )
}

export default UserMessage
