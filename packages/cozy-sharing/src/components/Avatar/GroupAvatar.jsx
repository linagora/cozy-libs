import { Icon, Team } from '@linagora/twake-icons'
import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'

const GroupAvatar = ({ size, className }) => {
  return (
    <Avatar size={size} className={className} border>
      <Icon icon={Team} />
    </Avatar>
  )
}

export { GroupAvatar }
