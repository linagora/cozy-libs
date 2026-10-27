import React from 'react'

import WhoHasAccess from './WhoHasAccess'

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
  return (
    <WhoHasAccess
      isOwner={isOwner}
      canManageSharing={canManageSharing}
      isSharedDrive={isSharedDrive}
      isReadOnly={isReadOnly}
      canManageMembers={canManageMembers}
      canManageLink={canManageLink}
      showOwner={showOwner}
      recipients={recipients}
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
