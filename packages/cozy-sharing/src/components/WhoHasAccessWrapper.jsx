import React from 'react'

import { useClient } from 'cozy-client'

import WhoHasAccess from './WhoHasAccess'
import { markCurrentUser } from '../helpers/recipients'

const WhoHasAccessWrapper = ({
  isOwner,
  canManageSharing,
  isSharedDrive,
  isReadOnly,
  canManageMembers,
  canManageLink,
  showOwner,
  recipients,
  recipientsToBeConfirmed,
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  verifyRecipient,
  link,
  permissions
}) => {
  const client = useClient()

  return (
    <WhoHasAccess
      isOwner={isOwner}
      canManageSharing={canManageSharing}
      isSharedDrive={isSharedDrive}
      isReadOnly={isReadOnly}
      canManageMembers={canManageMembers}
      canManageLink={canManageLink}
      showOwner={showOwner}
      recipients={markCurrentUser(recipients, client.options.uri)}
      recipientsToBeConfirmed={recipientsToBeConfirmed}
      document={document}
      documentType={documentType}
      className={className}
      onRevoke={onRevoke}
      onRevokeSelf={onRevokeSelf}
      verifyRecipient={verifyRecipient}
      link={link}
      permissions={permissions}
    />
  )
}

export default WhoHasAccessWrapper
