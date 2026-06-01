import cx from 'classnames'
import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantColorIcon from 'cozy-ui/transpiled/react/Icons/AssistantColor'

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
    return <Icon icon={AssistantColorIcon} className={iconClassName} />
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
