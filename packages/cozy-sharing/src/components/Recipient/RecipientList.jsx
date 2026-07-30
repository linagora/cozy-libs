import React from 'react'

import { GroupRecipient } from './GroupRecipient'
import MemberRecipient from './MemberRecipient'
import { usePrevious } from '../../helpers/hooks'
import { filterAndReworkRecipients } from '../../helpers/recipients'

const RecipientList = ({
  recipients,
  recipientsToBeConfirmed,
  isOwner,
  canManageSharing,
  canManageMembers,
  isSharedDrive,
  document,
  documentType,
  onRevoke,
  onRevokeSelf,
  verifyRecipient
}) => {
  const previousRecipients = usePrevious(recipients)
  const recipientsToDisplay = filterAndReworkRecipients(
    recipients,
    previousRecipients
  )

  return recipientsToDisplay.map(recipient => {
    const recipientConfirmationData = recipientsToBeConfirmed.find(
      user => user.email === recipient.email
    )

    const isGroupRecipient = recipient.members
    if (isGroupRecipient) {
      return (
        <GroupRecipient
          {...recipient}
          isOwner={isOwner}
          canManageMembers={canManageMembers}
          key={recipient.index}
          document={document}
          documentType={documentType}
          onRevoke={onRevoke}
          onRevokeSelf={onRevokeSelf}
          fadeIn={recipient.hasBeenJustAdded}
        />
      )
    }

    return (
      <MemberRecipient
        {...recipient}
        key={recipient.index}
        isOwner={isOwner}
        canManageSharing={canManageSharing}
        canManageMembers={canManageMembers}
        isSharedDrive={isSharedDrive}
        document={document}
        documentType={documentType}
        onRevoke={onRevoke}
        onRevokeSelf={onRevokeSelf}
        recipientConfirmationData={recipientConfirmationData}
        verifyRecipient={verifyRecipient}
        fadeIn={recipient.hasBeenJustAdded}
      />
    )
  })
}

export { RecipientList }
