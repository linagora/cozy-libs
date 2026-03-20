import { models } from 'cozy-client'

const ContactModel = models.contact

export const RECIPIENT_INDEX_PREFIX = 'virtual-shared-drive-sharing-'

export const mergeAndDeduplicateRecipients = arrays => {
  const combinedArray = arrays.flat().map(item => ({
    ...item,
    id: item.id || item._id
  }))

  const seenIds = new Set()

  const uniqueArray = combinedArray.reduce((acc, item) => {
    const id = item.id || item._id

    if (id == null) {
      // Recipients without any identifier are kept as-is to avoid silent data loss
      acc.push(item)
      return acc
    }

    if (!seenIds.has(id)) {
      seenIds.add(id)
      // Ensure both id and _id exist for downstream compatibility
      const normalizedItem =
        !item.id || !item._id
          ? { ...item, id: item.id || item._id, _id: item._id || item.id }
          : item
      acc.push(normalizedItem)
    }

    return acc
  }, [])

  return uniqueArray
}

export const moveRecipientToReadWrite = (federatedRecipients, _id) => {
  const recipientToMove = federatedRecipients.readOnlyRecipients.find(
    r => r._id === _id
  )
  if (!recipientToMove) return federatedRecipients

  return {
    recipients: [...federatedRecipients.recipients, recipientToMove],
    readOnlyRecipients: federatedRecipients.readOnlyRecipients.filter(
      r => r._id !== _id
    )
  }
}

export const moveRecipientToReadOnly = (federatedRecipients, _id) => {
  const recipientToMove = federatedRecipients.recipients.find(
    r => r._id === _id
  )
  if (!recipientToMove) return federatedRecipients

  return {
    recipients: federatedRecipients.recipients.filter(r => r._id !== _id),
    readOnlyRecipients: [
      ...federatedRecipients.readOnlyRecipients,
      recipientToMove
    ]
  }
}

export const formatRecipients = sharedDriveRecipients => {
  const recipients = []

  sharedDriveRecipients.recipients.forEach(r => {
    recipients.push({
      index: `${RECIPIENT_INDEX_PREFIX}${r._id}`,
      email: ContactModel.getPrimaryEmail(r),
      public_name: r.displayName || r.name,
      memberIndex: r._id,
      type: 'two-way',
      members: r.members
    })
  })

  sharedDriveRecipients.readOnlyRecipients.forEach(r => {
    recipients.push({
      index: `${RECIPIENT_INDEX_PREFIX}${r._id}`,
      email: ContactModel.getPrimaryEmail(r),
      public_name: r.displayName || r.name,
      memberIndex: r._id,
      type: 'one-way',
      members: r.members
    })
  })

  // We need to sort recipients by public_name
  // to avoid reording them every time we change
  // them from read only to read write.
  recipients.sort((a, b) => {
    if (a.public_name < b.public_name) {
      return -1
    }
    if (a.public_name > b.public_name) {
      return 1
    }
    return 0
  })

  return recipients
}
