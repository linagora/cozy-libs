import React from 'react'

import { useClient } from 'cozy-client'
import MemberRoleMenu from 'cozy-ui/transpiled/react/MemberRow/MemberRoleMenu'
import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import { makeMemberRoles } from '../../helpers/members'
import { makeAvatarUrl } from '../../helpers/recipients'
import withLocales from '../../hoc/withLocales'
import { useMemberTypeChange } from '../../hooks/useMemberTypeChange'
import { getDisplayName, getInitials } from '../../models'

const PermissionTypeMenuWrapper = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const { t } = useI18n()
  const client = useClient()
  const {
    changeMemberType,
    isDowngradeDialogOpen,
    downgradedRecipient,
    sharedParentName,
    confirmDowngrade,
    cancelDowngrade
  } = useMemberTypeChange(document)
  const member = {
    id: `sharing-${sharingId}-member-${memberIndex}`,
    name: getDisplayName(recipient),
    initials: getInitials(recipient),
    avatarUrl: makeAvatarUrl(recipient, client.options.uri)
  }
  const roles = makeMemberRoles(t)

  const handleSetType = newType =>
    changeMemberType({ sharingId, memberIndex, type, recipient }, newType)

  return (
    <>
      <MemberRoleMenu
        member={member}
        value={type}
        roles={roles}
        onChange={handleSetType}
      />
      {isDowngradeDialogOpen && (
        <DowngradePermissionConfirmDialog
          document={document}
          recipient={downgradedRecipient}
          sharedParentName={sharedParentName}
          onCancel={cancelDowngrade}
          onConfirm={confirmDowngrade}
        />
      )}
    </>
  )
}

export default withLocales(PermissionTypeMenuWrapper)
