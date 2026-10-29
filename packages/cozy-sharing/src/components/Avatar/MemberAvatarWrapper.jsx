import React from 'react'

import { useClient } from 'cozy-client'
import MemberAvatar from 'cozy-ui/transpiled/react/MemberRow/MemberAvatar'

import { makeAvatarUrl } from '../../helpers/recipients'
import logger from '../../logger'
import { getInitials } from '../../models'

const MemberAvatarWrapper = ({ recipient, ...avatarProps }) => {
  const client = useClient()

  // There are cases when due to apparent memory leaks, the recipient does not exist
  // This will trigger an unhanded error in the Avatar component and crash the app
  // At the moment, we are not sure where is the root cause of this cascading undefined props
  // Nevertheless, we can prevent the crash by returning null if the recipient is undefined
  if (!recipient) {
    // eslint-disable-next-line
    logger.warn('RecipientAvatar: recipient is missing, see props:', { recipient, ...avatarProps })
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
