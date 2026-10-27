import React from 'react'

import PermissionTypeMenu from './PermissionTypeMenu'
import withLocales from '../../hoc/withLocales'
import { useMemberPermissionType } from '../../hooks/useMemberPermissionType'

const PermissionTypeMenuWrapper = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const { isInsideSharedParent, sharedParentName, setMemberType } =
    useMemberPermissionType(document)

  const handleSetType = (newType, options) =>
    setMemberType({ sharingId, memberIndex, type, recipient }, newType, options)

  return (
    <PermissionTypeMenu
      type={type}
      document={document}
      recipient={recipient}
      isInsideSharedParent={isInsideSharedParent}
      sharedParentName={sharedParentName}
      onSetType={handleSetType}
    />
  )
}

export default withLocales(PermissionTypeMenuWrapper)
