import { Icon, AssistantColor } from '@linagora/twake-icons'
import cx from 'classnames'
import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'

import styles from './styles.styl'

const AssistantAvatar = ({ assistant, isSmall, className }) => {
  if (!assistant) return null

  const iconClassName = cx(
    styles['assistant-icon'],
    {
      [styles['assistant-icon--small']]: isSmall
    },
    className
  )

  if (!assistant.icon) {
    return <Icon icon={AssistantColor} className={iconClassName} />
  }

  return (
    <Avatar
      src={assistant.icon}
      alt={assistant.name}
      size={isSmall ? 12 : 24}
      className={iconClassName}
    />
  )
}

export default AssistantAvatar
