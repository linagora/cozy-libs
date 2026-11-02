import React from 'react'

import { useClient } from 'cozy-client'
import MemberAvatar from 'cozy-ui/transpiled/react/MemberRow/MemberAvatar'

import { makeAvatarUrl } from '../../helpers/recipients'
import logger from '../../logger'
import { getInitials } from '../../models'

const MemberAvatarWrapper = ({ recipient, ...avatarProps }) => {
  const client = useClient()

  if (!recipient) {
    logger.warn('RecipientAvatar: recipient is missing, see props:', {
      recipient,
      ...avatarProps
    })
    return null
  }

  return (
    <MemberAvatar
      initials={getInitials(recipient)}
      avatarUrl={makeAvatarUrl(recipient, client.options.uri)}
      {...avatarProps}
    />
  )
}

export { MemberAvatarWrapper }
