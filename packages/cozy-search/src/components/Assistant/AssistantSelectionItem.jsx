import cx from 'classnames'
import React, { useMemo } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Badge from 'cozy-ui/transpiled/react/Badge'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import PenIcon from 'cozy-ui/transpiled/react/Icons/Pen'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from './styles.styl'
import AssistantAvatar from '../Assistant/AssistantAvatar'

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
  const { isMobile } = useBreakpoints()

  const handleSelect = assistant => {
    onSelect(assistant)
    onClose()
  }

  const assistantId = assistant._id || assistant.id

  const handleDelete = e => {
    setAssistantIdInAction(assistantId)
    setIsOpenDeleteAssistant(true)
    onClose()
    e.stopPropagation()
  }

  const handleEdit = e => {
    setAssistantIdInAction(assistantId)
    setIsOpenEditAssistant(true)
    onClose()
    e.stopPropagation()
  }

  const isSelected = useMemo(
    () => selectedAssistant?._id === assistantId,
    [selectedAssistant?._id, assistantId]
  )

  return (
    <ActionsMenuItem
      onClick={() => handleSelect(assistant)}
      className={styles['menu-item']}
    >
      <div className="u-flex u-flex-items-center">
        {isMobile && isSelected ? (
          <Badge
            badgeContent={
              <Icon
                icon={CheckIcon}
                size={10}
                className={styles['selected-item--mobile']}
              />
            }
            variant="standard"
            size="small"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            overlap="circular"
          >
            <AssistantAvatar assistant={assistant} />
          </Badge>
        ) : (
          <AssistantAvatar assistant={assistant} />
        )}
        <Typography variant="body1">{assistant.name}</Typography>
      </div>
      <div className="u-flex u-flex-items-center u-flex-justify-between">
        {isSelected && !isMobile && (
          <Icon icon={CheckIcon} className="u-success" />
        )}
        {!disableActions && (
          <>
            <IconButton
              aria-label="Edit assistant"
              size="small"
              className={cx({
                [styles['menu-item-icon-button']]:
                  !isMobile || (!isSelected && isMobile),
                'u-db': isSelected && isMobile
              })}
              onClick={handleEdit}
            >
              <Icon icon={PenIcon} color="var(--primaryColor)" />
            </IconButton>
            <IconButton
              aria-label="Delete assistant"
              size="small"
              className={cx({
                [styles['menu-item-icon-button']]:
                  !isMobile || (!isSelected && isMobile),
                'u-db': isSelected && isMobile
              })}
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
