import cx from 'classnames'
import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import AssistantColorIcon from 'cozy-ui/transpiled/react/Icons/AssistantColor'

import styles from './styles.styl'
import { DEFAULT_ASSISTANT } from '../constants'

const AssistantAvatar = ({ assistant, isSmall }) => {
  if (!assistant) return

  if (assistant.id !== DEFAULT_ASSISTANT.id && !assistant.icon) {
    return (
      <Icon
        icon={AssistantIcon}
        className={cx(styles['assistant-icon'], {
          [styles['assistant-icon--small']]: isSmall
        })}
      />
    )
  }

  return assistant.id === DEFAULT_ASSISTANT.id ? (
    <Icon
      icon={AssistantColorIcon}
      className={cx(styles['assistant-icon'], {
        [styles['assistant-icon--small']]: isSmall
      })}
    />
  ) : (
    <img
      src={assistant.icon}
      alt={assistant.name}
      className={cx(styles['assistant-icon'], {
        [styles['assistant-icon--small']]: isSmall
      })}
    />
  )
}

export default AssistantAvatar
