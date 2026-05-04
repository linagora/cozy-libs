import { useState } from 'react'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import {
  RECIPIENT_INDEX_PREFIX,
  formatRecipients,
  mergeAndDeduplicateRecipients,
  moveRecipientToReadOnly,
  moveRecipientToReadWrite
} from './helpers'
import { Contact } from '../../models'

export const useSharedDrive = ({ onSuccess }) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()

  const [sharedDriveRecipients, setSharedDriveRecipients] = useState({
    recipients: [],
    readOnlyRecipients: []
  })
  const [sharedDriveName, setSharedDriveName] = useState('')

  const handleSharedDriveNameChange = event => {
    setSharedDriveName(event.target.value)
  }

  const onShare = params => {
    setSharedDriveRecipients(prev => ({
      recipients: mergeAndDeduplicateRecipients([
        prev.recipients,
        params.recipients
      ]),
      readOnlyRecipients: mergeAndDeduplicateRecipients([
        prev.readOnlyRecipients,
        params.readOnlyRecipients
      ])
    }))
  }

  const onCreate = async () => {
    try {
      await client.collection('io.cozy.sharings').createSharedDrive({
        name: sharedDriveName,
        description: sharedDriveName,
        recipients: sharedDriveRecipients.recipients,
        readOnlyRecipients: sharedDriveRecipients.readOnlyRecipients
      })

      showAlert({
        message: t('SharedDrive.sharedDriveModal.successNotification'),
        severity: 'success',
        variant: 'filled'
      })

      onSuccess()
    } catch (_err) {
      showAlert({
        message: t('SharedDrive.sharedDriveModal.errorNotification'),
        severity: 'error',
        variant: 'filled'
      })
    }
  }

  const onSetType = (index, newType) => {
    const _id = index.split(RECIPIENT_INDEX_PREFIX)[1]
    setSharedDriveRecipients(prev =>
      newType === 'two-way'
        ? moveRecipientToReadWrite(prev, _id)
        : moveRecipientToReadOnly(prev, _id)
    )
  }

  const onRevoke = index => {
    const _id = index.split(RECIPIENT_INDEX_PREFIX)[1]
    setSharedDriveRecipients(prev => ({
      recipients: prev.recipients.filter(r => r._id !== _id),
      readOnlyRecipients: prev.readOnlyRecipients.filter(r => r._id !== _id)
    }))
  }

  const createContact = contact => client.create(Contact.doctype, contact)

  return {
    sharedDriveName,
    recipients: formatRecipients(sharedDriveRecipients),
    handleSharedDriveNameChange,
    onShare,
    onCreate,
    onSetType,
    onRevoke,
    createContact
  }
}
