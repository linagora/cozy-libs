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

  const onCreate = async () => {
    const { recipients: readWriteRecipients, readOnlyRecipients } =
      await resolveRecipients(pendingRecipients, selectedOption)

    await client.collection('io.cozy.sharings').createSharedDrive({
      name: sharedDriveName,
      description: sharedDriveName,
      recipients: readWriteRecipients,
      readOnlyRecipients
    })
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
