import cx from 'classnames'
import React, { useState, useRef } from 'react'

import { useQuery } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Chips from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantsQuery } from '../queries'
import AssistantAvatar from './AssistantAvatar'
import AssistantSelectionItem from './AssistantSelectionItem'

const AssistantSelection = ({ className }) => {
  const buttonRef = useRef(null)
  const [open, setOpen] = useState(false)
  const {
    setIsOpenCreateAssistant,
    setAssistantIdInAction,
    setIsOpenDeleteAssistant,
    setIsOpenEditAssistant,
    selectedAssistantId,
    setSelectedAssistantId
  } = useAssistant()

  const assistantsQuery = buildAssistantsQuery()
  const assistants =
    useQuery(assistantsQuery.definition, assistantsQuery.options)?.data || []

  const handleClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleCreate = () => {
    setIsOpenCreateAssistant(true)
    handleClose()
  }

  const selectedAssistant =
    assistants.find(assistant => assistant.id === selectedAssistantId) ||
    DEFAULT_ASSISTANT

  return (
    <>
      <div className={className} ref={buttonRef}>
        <Chips
          icon={
            <AssistantAvatar
              className="u-ml-half"
              isSmall={true}
              assistant={selectedAssistant}
            />
          }
          label={selectedAssistant.name}
          clickable
          onClick={handleClick}
        />
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
            <AssistantSelectionItem
              key={assistant.id}
              assistant={assistant}
              onClose={handleClose}
              onSelect={() => setSelectedAssistantId(assistant.id)}
              selectedAssistant={selectedAssistant}
              setIsOpenDeleteAssistant={setIsOpenDeleteAssistant}
              setAssistantIdInAction={setAssistantIdInAction}
              setIsOpenEditAssistant={setIsOpenEditAssistant}
            />
          ))}
          <AssistantSelectionItem
            assistant={DEFAULT_ASSISTANT}
            onClose={handleClose}
            onSelect={() => setSelectedAssistantId(DEFAULT_ASSISTANT.id)}
            selectedAssistant={selectedAssistant}
            disableActions={true}
          />
          <ActionsMenuItem
            onClick={handleCreate}
            className={cx(styles['menu-item'], styles['create-item'])}
          >
            <div className="u-flex u-flex-items-center">
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
