import React, { useState } from 'react'
import { useI18n, useExtendI18n } from 'twake-i18n'

import { useClient, useQuery } from 'cozy-client'
import { deleteAssistant } from 'cozy-client/dist/models/assistant'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import {
  DialogContent,
  DialogActions,
  DialogTitle
} from 'cozy-ui/transpiled/react/Dialog'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import { locales } from '../../locales'
import { useAssistant } from '../AssistantProvider'
import styles from '../CreateAssistantSteps/styles.styl'
import { buildAssistantByIdQuery } from '../queries'

const DeleteAssistantDialog = ({ open, onClose }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const client = useClient()
  const { assistantIdInAction, setAssistantIdInAction } = useAssistant()
  const { showAlert } = useAlert()
  const [isDeleting, setIsDeleting] = useState(false)

  const assistantQuery = buildAssistantByIdQuery(assistantIdInAction)
  const { data: assistant, fetchStatus } =
    useQuery(assistantQuery.definition, assistantQuery.options) || {}

  const isLoading = fetchStatus === 'loading' || fetchStatus === 'pending'
  const displayName = assistant?.name || assistantIdInAction || '...'

  const handleDeleteAssistant = async () => {
    if (!assistantIdInAction) return

    try {
      setIsDeleting(true)
      await deleteAssistant(client, assistantIdInAction)
      setAssistantIdInAction(null)
      onClose()
    } catch (error) {
      showAlert({ message: t('assistant.default_error'), severity: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      className={styles.CreateAssistantDialog}
    >
      <DialogTitle disableTypography={true}>
        {t('assistant_delete.title')}
      </DialogTitle>
      <IconButton
        aria-label={t('assistant.dialog.close')}
        onClick={onClose}
        className={styles['close-button']}
      >
        <Icon icon={CrossIcon} />
      </IconButton>
      <DialogContent>
        {t('assistant_delete.content', { name: displayName })}
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
          label={t('assistant_delete.buttons.cancel')}
        />
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteAssistant}
          disabled={isLoading || isDeleting || !assistantIdInAction}
          label={t('assistant_delete.buttons.confirm')}
        />
      </DialogActions>
    </Dialog>
  )
}

export default DeleteAssistantDialog
