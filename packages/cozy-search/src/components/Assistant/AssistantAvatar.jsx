import cx from 'classnames'
import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import AssistantColorIcon from 'cozy-ui/transpiled/react/Icons/AssistantColor'

import styles from './styles.styl'
import { DEFAULT_ASSISTANT } from '../constants'

const AssistantAvatar = ({ assistant, isSmall, className }) => {
  if (!assistant) return null

  const iconClassName = cx(
    styles['assistant-icon'],
    {
      [styles['assistant-icon--small']]: isSmall
    },
    className
  )

  if (assistant._id !== DEFAULT_ASSISTANT._id && !assistant.icon) {
    return <Icon icon={AssistantIcon} className={iconClassName} />
  }

  return assistant.id === DEFAULT_ASSISTANT.id ? (
    <Icon icon={AssistantColorIcon} className={iconClassName} />
  ) : (
    <Avatar
      src={assistant.icon}
      alt={assistant.name}
      size={isSmall ? 12 : 24}
      className={iconClassName}
    />
  )
}

export default AssistantAvatar
