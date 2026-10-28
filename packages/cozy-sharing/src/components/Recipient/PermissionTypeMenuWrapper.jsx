import React from 'react'

import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import PermissionTypeMenu from './PermissionTypeMenu'
import { makeMemberRoles } from '../../helpers/members'
import withLocales from '../../hoc/withLocales'
import { useMemberTypeChange } from '../../hooks/useMemberTypeChange'

const PermissionTypeMenuWrapper = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const { t } = useI18n()
  const {
    changeMemberType,
    isDowngradeDialogOpen,
    downgradedRecipient,
    sharedParentName,
    confirmDowngrade,
    cancelDowngrade
  } = useMemberTypeChange(document)
  const roles = makeMemberRoles(t)

  const handleSetType = newType =>
    changeMemberType({ sharingId, memberIndex, type, recipient }, newType)

  return (
    <>
      <PermissionTypeMenu value={type} roles={roles} onChange={handleSetType} />
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
