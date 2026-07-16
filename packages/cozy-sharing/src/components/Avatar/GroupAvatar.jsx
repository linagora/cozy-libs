import React from 'react'

import { Icon, Peoples } from '@linagora/twake-icons'
import Avatar, { colorToGradient } from 'cozy-ui/transpiled/react/Avatar'
import { COLORS } from 'cozy-ui/transpiled/react/ColorList/helpers'

const DEFAULT_COLOR = COLORS[4]

const GroupAvatar = ({ size, color = DEFAULT_COLOR, className }) => {
  return (
    <Avatar size={size} color={colorToGradient(color)} className={className}>
      <Icon icon={Peoples} />
    </Avatar>
  )
}

export { GroupAvatar }
