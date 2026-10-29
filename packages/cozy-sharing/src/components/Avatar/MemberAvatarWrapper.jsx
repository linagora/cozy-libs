import React from 'react'

import { useClient } from 'cozy-client'

import { makeAvatarUrl } from '../../helpers/recipients'
import { MemberAvatar } from './MemberAvatar'

const MemberAvatarWrapper = ({ recipient, ...avatarProps }) => {
  const client = useClient()

  return (
    <MemberAvatar
      recipient={recipient}
      avatarUrl={
        recipient ? makeAvatarUrl(recipient, client.options.uri) : null
      }
      {...avatarProps}
    />
  )
}

export { MemberAvatarWrapper }
