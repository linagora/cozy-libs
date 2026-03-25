import React from 'react'

import { useClient } from 'cozy-client'
import Avatar from 'cozy-ui/transpiled/react/Avatar'

const AvatarMyself = ({ className, size = 'm' }) => {
  const client = useClient()
  const rootURL = client.getStackClient().uri

  return (
    <Avatar
      className={className}
      size={size}
      src={`${rootURL}/public/avatar?fallback=initials`}
    />
  )
}

export default AvatarMyself
