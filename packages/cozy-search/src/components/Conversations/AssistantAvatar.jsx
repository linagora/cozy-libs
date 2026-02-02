import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import AssistantColorIcon from 'cozy-ui/transpiled/react/Icons/AssistantColor'

import styles from './styles.styl'
import { DEFAULT_ASSISTANT } from '../constants'

const AssistantAvatar = ({ assistant }) => {
  if (!assistant) return

  if (assistant.id !== DEFAULT_ASSISTANT.id && !assistant.icon) {
    return <Icon icon={AssistantIcon} className={styles['assistant-icon']} />
  }

  return assistant.id === DEFAULT_ASSISTANT.id ? (
    <Icon icon={AssistantColorIcon} className={styles['assistant-icon']} />
  ) : (
    <img
      src={assistant.icon}
      alt={assistant.name}
      className={styles['assistant-icon']}
    />
  )
}

export default AssistantAvatar
