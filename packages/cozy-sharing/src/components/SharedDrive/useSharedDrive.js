import { useState } from 'react'

import { useClient } from 'cozy-client'

import { getOrCreateFromArray } from '../../helpers/contacts'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { Contact } from '../../models'

export const useSharedDrive = () => {
  const client = useClient()

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
    const contacts = await getOrCreateFromArray(
      client,
      pendingRecipients,
      createContact
    )
    const readWriteRecipients = selectedOption === 'readOnly' ? [] : contacts
    const readOnlyRecipients = selectedOption === 'readOnly' ? contacts : []

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
