import PropTypes from 'prop-types'
import React from 'react'

import List from 'cozy-ui/transpiled/react/List'
import { useI18n } from 'twake-i18n'

import LinkRecipient from './Recipient/LinkRecipient'
import OwnerRecipient from './Recipient/OwnerRecipient'
import { RecipientList } from './Recipient/RecipientList'
import { usePrevious } from '../helpers/hooks'

/**
 * Displays a warning if some contacts are waiting for confirmation of their sharing
 *
 * This may happen in two steps confirmation scenario like when sharing passwords
 */
const RecipientWaitingForConfirmationAlert = ({ recipientsToBeConfirmed }) => {
  const { t } = useI18n()

  if (recipientsToBeConfirmed.length > 0) {
    return t(`Share.twoStepsConfirmation.contactAreWaitingForConfirmation`, {
      smart_count: recipientsToBeConfirmed.length
    })
  }

  return null
}

const WhoHasAccess = ({
  isOwner = false,
  canManageSharing = isOwner,
  isSharedDrive = false,
  isReadOnly = false,
  canManageMembers = !isReadOnly,
  canManageLink = canManageMembers,
  showOwner = true,
  owner,
  isInsideSharedParent = false,
  sharedParentName,
  recipients,
  recipientsToBeConfirmed = [],
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  onRevokeGroup,
  onLeaveGroup,
  onSetMemberType,
  onUpdateLinkPermissions,
  onRevokeLink,
  verifyRecipient,
  link,
  permissions
}) => {
  const previousLink = usePrevious(link)
  const linkHasBeenJustCreated = link && previousLink === null

  return (
    <div className={className}>
      <RecipientWaitingForConfirmationAlert
        recipientsToBeConfirmed={recipientsToBeConfirmed}
      />
      <List>
        {link && (
          <LinkRecipient
            isReadOnly={!canManageLink}
            document={document}
            documentType={documentType}
            onRevoke={onRevoke}
            onRevokeSelf={onRevokeSelf}
            permissions={permissions}
            onUpdateLinkPermissions={onUpdateLinkPermissions}
            onRevokeLink={onRevokeLink}
            fadeIn={linkHasBeenJustCreated}
          />
        )}

        {showOwner && <OwnerRecipient owner={owner} />}

        <RecipientList
          recipients={recipients}
          recipientsToBeConfirmed={recipientsToBeConfirmed}
          isOwner={isOwner}
          canManageSharing={canManageSharing}
          canManageMembers={canManageMembers}
          isSharedDrive={isSharedDrive}
          document={document}
          documentType={documentType}
          isInsideSharedParent={isInsideSharedParent}
          sharedParentName={sharedParentName}
          onRevoke={onRevoke}
          onRevokeSelf={onRevokeSelf}
          onRevokeGroup={onRevokeGroup}
          onLeaveGroup={onLeaveGroup}
          onSetMemberType={onSetMemberType}
          verifyRecipient={verifyRecipient}
        />
      </List>
    </div>
  )
}

WhoHasAccess.propTypes = {
  isOwner: PropTypes.bool,
  canManageSharing: PropTypes.bool,
  canManageMembers: PropTypes.bool,
  canManageLink: PropTypes.bool,
  showOwner: PropTypes.bool,
  owner: PropTypes.object,
  isInsideSharedParent: PropTypes.bool,
  sharedParentName: PropTypes.string,
  recipients: PropTypes.array.isRequired,
  recipientsToBeConfirmed: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string.isRequired
    })
  ),
  document: PropTypes.object,
  documentType: PropTypes.string.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onRevokeSelf: PropTypes.func,
  onRevokeGroup: PropTypes.func.isRequired,
  onLeaveGroup: PropTypes.func.isRequired,
  onSetMemberType: PropTypes.func.isRequired,
  onUpdateLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired,
  verifyRecipient: PropTypes.func,
  permissions: PropTypes.arrayOf(PropTypes.object)
}
export default WhoHasAccess
