/**
 * CozyUserMessage renders user messages in the chat using cozy-ui components
 * integrated with assistant-ui's MessagePrimitive.
 */

import React from 'react'

import { useI18n } from 'twake-i18n'

import { getDisplayName, getInitials } from 'cozy-client/dist/models/contact'
import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Box from 'cozy-ui/transpiled/react/Box'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { MessagePrimitive } from '@assistant-ui/react'

import styles from './styles.styl'

interface CozyUserMessageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  myself?: any
}

const CozyUserMessage = ({ myself }: CozyUserMessageProps) => {
  const { t } = useI18n()

  const contact = myself || { displayName: t('assistant.default_username') }

  return (
    <MessagePrimitive.Root className="u-mt-1-half">
      <Box display="flex" alignItems="center" gridGap={12}>
        {/* @ts-ignore - Avatar size accepts number */}
        <Avatar text={getInitials(contact)} size={24} />
        <Typography variant="h6" display="inline">
          {getDisplayName(contact)}
        </Typography>
      </Box>
      <Box pl="44px" className={styles['cozyThread-messageContent']}>
        <MessagePrimitive.Content />
      </Box>
    </MessagePrimitive.Root>
  )
}

export default CozyUserMessage
