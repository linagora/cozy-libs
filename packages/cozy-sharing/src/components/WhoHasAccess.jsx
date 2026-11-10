import PropTypes from 'prop-types'
import React from 'react'

import MemberList from 'cozy-ui/transpiled/react/MemberList'
import { useI18n } from 'twake-i18n'

import PublicAccess from './PublicAccess/PublicAccess'
import styles from '../styles/share.styl'

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
  showEmptyState,
  showPublicAccess = false,
  canManageLink = true,
  isAutoOpenSettings = false,
  recipientsToBeConfirmed = [],
  document,
  documentType,
  className,
  link,
  permissions,
  onUpdateLinkPermissions,
  onRevokeLink
}) => {
  const isPublicAccessShown = showPublicAccess && canManageLink

  return (
    <div className={className}>
      <RecipientWaitingForConfirmationAlert
        recipientsToBeConfirmed={recipientsToBeConfirmed}
      />
      <div className={styles['share-dialog-members-list']}>
        <MemberList
          members={members}
          roles={roles}
          onRoleChange={onRoleChange}
          onRemove={onRemove}
          showEmptyState={showEmptyState}
        />
      </div>
      {isPublicAccessShown && (
        <PublicAccess
          document={document}
          documentType={documentType}
          link={link}
          permissions={permissions}
          isAutoOpenSettings={isAutoOpenSettings}
          onUpdateLinkPermissions={onUpdateLinkPermissions}
          onRevokeLink={onRevokeLink}
        />
      )}
    </div>
  )
}

WhoHasAccess.propTypes = {
  members: PropTypes.array.isRequired,
  roles: PropTypes.array.isRequired,
  onRoleChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  showEmptyState: PropTypes.bool,
  showPublicAccess: PropTypes.bool,
  canManageLink: PropTypes.bool,
  isAutoOpenSettings: PropTypes.bool,
  recipientsToBeConfirmed: PropTypes.arrayOf(
    PropTypes.shape({
      email: PropTypes.string.isRequired
    })
  ),
  document: PropTypes.object,
  documentType: PropTypes.string.isRequired,
  onUpdateLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired,
  permissions: PropTypes.arrayOf(PropTypes.object)
}
export default WhoHasAccess
