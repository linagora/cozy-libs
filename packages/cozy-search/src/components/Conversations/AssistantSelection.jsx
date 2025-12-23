import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'

const AssistantSelection = ({
  assistants,
  selectedAssistant,
  onSelect,
  onCreate
}) => {
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)

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
        >
          {selectedAssistant ? (
            <>
              <img
                src={selectedAssistant.icon}
                alt=""
                className={styles['assistant-icon']}
              />
              <Typography variant="body1">{selectedAssistant.name}</Typography>
            </>
          ) : (
            <Typography variant="body1">Select Assistant</Typography>
          )}
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
            onClick={handleCreate}
            className={styles['menu-item']}
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
