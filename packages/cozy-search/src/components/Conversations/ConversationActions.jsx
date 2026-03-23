import React, { useState, useRef } from 'react'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import TextField from 'cozy-ui/transpiled/react/TextField'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { remove } from '../../actions/delete'
import { rename } from '../../actions/rename'
import { share } from '../../actions/share'
import { getNameOfConversation } from '../helpers'
import { CHAT_CONVERSATIONS_DOCTYPE } from '../queries'

const ConversationActions = ({ buttonClassName, conversation }) => {
  const { t } = useI18n()
  const client = useClient()
  const { showAlert } = useAlert()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newName, setNewName] = useState('')
  const anchorRef = useRef(null)

  const toggleMenu = e => {
    e?.stopPropagation()
    setIsMenuOpen(prev => !prev)
  }

  const handleOpenRename = () => {
    setNewName(getNameOfConversation(conversation) || '')
    setShowRenameDialog(true)
  }

  const handleRename = async () => {
    try {
      await client.save({
        ...conversation,
        _type: CHAT_CONVERSATIONS_DOCTYPE,
        name: newName.trim()
      })
      setShowRenameDialog(false)
    } catch {
      showAlert({
        message: t('assistant.default_error'),
        severity: 'error'
      })
    }
  }

  const handleDelete = async () => {
    try {
      await client.destroy({
        ...conversation,
        _type: CHAT_CONVERSATIONS_DOCTYPE
      })
      setShowDeleteDialog(false)
    } catch {
      showAlert({
        message: t('assistant.default_error'),
        severity: 'error'
      })
    }
  }

  const actions = makeActions(
    [
      rename,
      flag('cozy.assistant.conversation-sharing.enabled') && share,
      remove
    ].filter(Boolean),
    { t, onRename: handleOpenRename, onDelete: () => setShowDeleteDialog(true) }
  )

  return (
    <>
      <IconButton
        className={buttonClassName}
        size="small"
        ref={anchorRef}
        onClick={toggleMenu}
      >
        <Icon icon={DotsIcon} />
      </IconButton>
      <ActionsMenu
        ref={anchorRef}
        open={isMenuOpen}
        actions={actions}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        autoClose
        onClose={toggleMenu}
      />
      {showRenameDialog && (
        <ConfirmDialog
          open
          title={t('assistant.sidebar.conversation.actions.rename')}
          content={
            <TextField
              autoFocus
              fullWidth
              variant="outlined"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newName.trim()) {
                  handleRename()
                }
              }}
            />
          }
          actions={
            <>
              <Button
                variant="secondary"
                label={t('assistant_create.buttons.cancel')}
                onClick={() => setShowRenameDialog(false)}
              />
              <Button
                label={t('assistant_edit.buttons.edit')}
                onClick={handleRename}
                disabled={!newName.trim()}
              />
            </>
          }
          onClose={() => setShowRenameDialog(false)}
        />
      )}
      {showDeleteDialog && (
        <ConfirmDialog
          open
          title={t('conversation_delete.title')}
          content={t('conversation_delete.content')}
          actions={
            <>
              <Button
                variant="secondary"
                label={t('conversation_delete.buttons.cancel')}
                onClick={() => setShowDeleteDialog(false)}
              />
              <Button
                color="error"
                label={t('conversation_delete.buttons.confirm')}
                onClick={handleDelete}
              />
            </>
          }
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  )
}

export default ConversationActions
