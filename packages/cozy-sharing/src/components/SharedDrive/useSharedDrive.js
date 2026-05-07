import { useState } from 'react'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { Contact } from '../../models'
import { getOrCreateFromArray } from '../../helpers/contacts'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'

export const useSharedDrive = ({ onSuccess }) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()

  const [sharedDriveName, setSharedDriveName] = useState('')
  const {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  } = usePendingRecipients()

  const handleSharedDriveNameChange = event => {
    setSharedDriveName(event.target.value)
  }

  const createContact = contact => client.create(Contact.doctype, contact)

  const onCreate = async () => {
    try {
      const contacts = await getOrCreateFromArray(
        client,
        pendingRecipients,
        createContact
      )
      const readWriteRecipients =
        selectedOption === 'readOnly' ? [] : contacts
      const readOnlyRecipients =
        selectedOption === 'readOnly' ? contacts : []

      await client.collection('io.cozy.sharings').createSharedDrive({
        name: sharedDriveName,
        description: sharedDriveName,
        recipients: readWriteRecipients,
        readOnlyRecipients
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

  return {
    sharedDriveName,
    handleSharedDriveNameChange,
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption,
    onCreate
  }
}
