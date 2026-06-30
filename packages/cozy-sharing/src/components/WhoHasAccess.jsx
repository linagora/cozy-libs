import PropTypes from 'prop-types'
import React from 'react'

import List from 'cozy-ui/transpiled/react/List'
import { useI18n } from 'twake-i18n'

import LinkRecipient from './Recipient/LinkRecipient'
import OwnerRecipient from './Recipient/OwnerRecipient'
import { RecipientList } from './Recipient/RecipientList'
import { usePrevious } from '../helpers/hooks'
import { useSharingContext } from '../hooks/useSharingContext'

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
  showOwner = true,
  recipients,
  recipientsToBeConfirmed = [],
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  onSetType,
  verifyRecipient,
  link,
  permissions
}) => {
  const previousLink = usePrevious(link)
  const linkHasBeenJustCreated = link && previousLink === null
  const { isOrgSharedDrive } = useSharingContext()
  const isOrgDrive = isOrgSharedDrive(document?._id)

  return (
    <div className={className}>
      <RecipientWaitingForConfirmationAlert
        recipientsToBeConfirmed={recipientsToBeConfirmed}
      />
      <List>
        {link && (
          <LinkRecipient
            isReadOnly={isReadOnly}
            document={document}
            documentType={documentType}
            onRevoke={onRevoke}
            onRevokeSelf={onRevokeSelf}
            permissions={permissions}
            fadeIn={linkHasBeenJustCreated}
          />
        )}

        {showOwner && (
          <OwnerRecipient
            recipients={recipients}
            isOrgSharedDrive={isOrgDrive}
          />
        )}

        <RecipientList
          recipients={recipients}
          recipientsToBeConfirmed={recipientsToBeConfirmed}
          isOwner={isOwner}
          canManageSharing={canManageSharing}
          isSharedDrive={isSharedDrive}
          isReadOnly={isReadOnly}
          document={document}
          documentType={documentType}
          onRevoke={onRevoke}
          onRevokeSelf={onRevokeSelf}
          onSetType={onSetType}
          verifyRecipient={verifyRecipient}
        />
      </List>
    </div>
  )
}

WhoHasAccess.propTypes = {
  isOwner: PropTypes.bool,
  canManageSharing: PropTypes.bool,
  showOwner: PropTypes.bool,
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
  verifyRecipient: PropTypes.func
}
export default WhoHasAccess
