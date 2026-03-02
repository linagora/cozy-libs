import { MessagePrimitive } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'

import Card from 'cozy-ui/transpiled/react/Card'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'

import styles from './styles.styl'

const UserMessage = () => {
  const { type: theme } = useCozyTheme()

  return (
    <MessagePrimitive.Root className="u-mt-1">
      <Card
        className={cx(
          'u-bdrs-5 u-bdw-0 u-ml-auto u-p-half',
          styles['cozyThread-user-messages'],
          styles[`cozyThread-user-messages--${theme}`]
        )}
      >
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => <Typography>{text}</Typography>
          }}
        />
      </Card>
    </MessagePrimitive.Root>
  )
}

export default UserMessage
