import React from 'react'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import PermissionTypeMenu from './PermissionTypeMenu'
import withLocales from '../../hoc/withLocales'
import { useMemberTypeChange } from '../../hooks/useMemberTypeChange'

const PermissionTypeMenuWrapper = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const {
    changeMemberType,
    isDowngradeDialogOpen,
    downgradedRecipient,
    sharedParentName,
    confirmDowngrade,
    cancelDowngrade
  } = useMemberTypeChange(document)

  const handleSetType = newType =>
    changeMemberType({ sharingId, memberIndex, type, recipient }, newType)

  return (
    <>
      <PermissionTypeMenu type={type} onSetType={handleSetType} />
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
