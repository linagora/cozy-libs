import React from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import PenIcon from 'cozy-ui/transpiled/react/Icons/Pen'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import Typography from 'cozy-ui/transpiled/react/Typography'

import AssistantAvatar from '../Assistant/AssistantAvatar'
import styles from '../Conversations/styles.styl'

const AssistantSelectionItem = ({
  assistant,
  onClose,
  onSelect,
  selectedAssistant,
  setAssistantIdInAction,
  setIsOpenDeleteAssistant,
  setIsOpenEditAssistant,
  disableActions = false
}) => {
  const handleSelect = assistant => {
    onSelect(assistant)
    onClose()
  }

  const handleDelete = e => {
    setAssistantIdInAction(assistant.id)
    setIsOpenDeleteAssistant(true)
    onClose()
    e.stopPropagation()
  }

  const handleEdit = e => {
    setAssistantIdInAction(assistant.id)
    setIsOpenEditAssistant(true)
    onClose()
    e.stopPropagation()
  }

  return (
    <ActionsMenuItem
      onClick={() => handleSelect(assistant)}
      className={styles['menu-item']}
    >
      <div className="u-flex u-flex-items-center">
        <AssistantAvatar assistant={assistant} />
        <Typography variant="body1">{assistant.name}</Typography>
      </div>
      <div className="u-flex u-flex-items-center u-flex-justify-between">
        {selectedAssistant?.id === assistant.id && (
          <Icon icon={CheckIcon} className="u-success" />
        )}
        {!disableActions && (
          <>
            <IconButton
              aria-label="Edit assistant"
              size="small"
              className={styles['menu-item-icon-button']}
              onClick={handleEdit}
            >
              <Icon icon={PenIcon} color="var(--primaryColor)" />
            </IconButton>
            <IconButton
              aria-label="Delete assistant"
              size="small"
              className={styles['menu-item-icon-button']}
              onClick={handleDelete}
            >
              <Icon icon={TrashIcon} className="u-error" />
            </IconButton>
          </>
        )}
      </div>
    </ActionsMenuItem>
  )
}

export default AssistantSelectionItem
