import cx from 'classnames'
import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import DropdownIcon from 'cozy-ui/transpiled/react/Icons/Dropdown'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import { TwakeAssistantIconGadient } from '../AssistantIcon/TwakeAssistantIconGadient'

const AssistantSelection = ({ assistants, onSelect, onCreate }) => {
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState({
    id: 'ai_assistant',
    name: 'AI Assistant',
    icon: TwakeAssistantIconGadient
  })

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSelect = assistant => {
    onSelect(assistant)
    handleClose()
  }

  const handleCreate = () => {
    onCreate()
    handleClose()
  }

  return (
    <>
      <div ref={buttonRef}>
        <Button
          className={styles['trigger-button']}
          onClick={handleClick}
          variant="outlined"
          size="small"
          endIcon={<Icon icon={DropdownIcon} />}
        >
          {selectedAssistant.id === 'ai_assistant' ? (
            <Icon
              icon={selectedAssistant.icon}
              className={styles['assistant-icon']}
            />
          ) : (
            <img src={selectedAssistant.icon} />
          )}
          <Typography variant="body1">{selectedAssistant.name}</Typography>
        </Button>
      </div>
      {open && (
        <ActionsMenu
          open
          ref={buttonRef}
          onClose={handleClose}
          actions={[]}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
        >
          {assistants.map(assistant => (
            <ActionsMenuItem
              key={assistant.id}
              onClick={() => handleSelect(assistant)}
              className={styles['menu-item']}
            >
              <div className={styles['menu-item-content']}>
                <img
                  src={assistant.icon}
                  alt=""
                  className={styles['assistant-icon']}
                />
                <Typography variant="body1">{assistant.name}</Typography>
              </div>
              {selectedAssistant?.id === assistant.id && (
                <Icon icon={CheckIcon} color="var(--primaryColor)" />
              )}
            </ActionsMenuItem>
          ))}
          <ActionsMenuItem
            onClick={() =>
              setSelectedAssistant({
                id: 'ai_assistant',
                name: 'AI Assistant',
                icon: TwakeAssistantIconGadient
              })
            }
            className={styles['menu-item']}
          >
            <div className={styles['menu-item-content']}>
              <Icon
                icon={TwakeAssistantIconGadient}
                className={styles['assistant-icon']}
              />
              <Typography variant="body1">AI Assistant</Typography>
            </div>
          </ActionsMenuItem>
          <ActionsMenuItem
            onClick={handleCreate}
            className={cx(styles['menu-item'], styles['create-assistant-item'])}
          >
            <div className={styles['menu-item-content']}>
              <Icon icon={PlusIcon} className={styles['create-icon']} />
              <Typography variant="body1">Create Assistant</Typography>
            </div>
          </ActionsMenuItem>
        </ActionsMenu>
      )}
    </>
  )
}

export default AssistantSelection
