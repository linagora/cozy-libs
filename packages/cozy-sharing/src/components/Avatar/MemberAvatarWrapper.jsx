import React from 'react'

import { useClient } from 'cozy-client'

import { MemberAvatar } from './MemberAvatar'
import { makeAvatarUrl } from '../../helpers/recipients'

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
