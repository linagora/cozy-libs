import PropTypes from 'prop-types'
import React from 'react'

import List from 'cozy-ui/transpiled/react/List'
import MemberList from 'cozy-ui/transpiled/react/MemberList'
import { useI18n } from 'twake-i18n'

import LinkRecipient from './Recipient/LinkRecipient'
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
  members,
  roles,
  onRoleChange,
  onRemove,
  canManageLink = true,
  recipientsToBeConfirmed = [],
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  onUpdateLinkPermissions,
  onRevokeLink,
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
      {link && (
        <List className="u-pb-0">
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
        </List>
      )}
      <MemberList
        className={link ? 'u-pt-0' : undefined}
        members={members}
        roles={roles}
        onRoleChange={onRoleChange}
        onRemove={onRemove}
        showEmptyState={false}
      />
    </div>
  )
}

WhoHasAccess.propTypes = {
  members: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  canManageLink: PropTypes.bool,
  recipientsToBeConfirmed: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string.isRequired
    })
  ),
  document: PropTypes.object,
  documentType: PropTypes.string.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onRevokeSelf: PropTypes.func,
  onUpdateLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired,
  permissions: PropTypes.arrayOf(PropTypes.object)
}
export default WhoHasAccess
