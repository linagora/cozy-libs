import { useState } from 'react'

import { useClient } from 'cozy-client'

import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { useResolveRecipients } from '../../hooks/useResolveRecipients'

export const useSharedDrive = () => {
  const client = useClient()
  const resolveRecipients = useResolveRecipients()

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

  const trimmedName = sharedDriveName.trim()

  const onCreate = async () => {
    const { recipients: readWriteRecipients, readOnlyRecipients } =
      await resolveRecipients(pendingRecipients, selectedOption)

    await client.collection('io.cozy.sharings').createSharedDrive({
      name: trimmedName,
      description: trimmedName,
      recipients: readWriteRecipients,
      readOnlyRecipients
    })
  }

  return {
    sharedDriveName,
    isNameBlank: trimmedName === '',
    handleSharedDriveNameChange,
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption,
    onCreate
  }
}
