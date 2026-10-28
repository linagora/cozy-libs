import React, { useState, useCallback } from 'react'

import { Icon, CrossCircleOutline } from '@linagora/twake-icons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import PermissionTypeMenu from './PermissionTypeMenu'
import { hasMemberActions } from '../../helpers/recipients'

const MemberRecipientPermissions = ({
  isOwner,
  canManageSharing = isOwner,
  canManageMembers = true,
  status,
  isCurrentUser = false,
  type,
  document,
  onRevoke,
  onRevokeSelf,
  onSetMemberType,
  sharingId,
  memberIndex,
  ...recipient
}) => {
  const { t } = useI18n()

  const [revoking, setRevoking] = useState(false)

  const contactIsOwner = status === 'owner'
  const shouldShowMenu =
    !revoking &&
    hasMemberActions({
      status,
      isCurrentUser,
      isOwner,
      canManageSharing,
      canManageMembers
    })

  const handleRevocation = useCallback(async () => {
    setRevoking(true)
    try {
      if (isCurrentUser && !isOwner) {
        await onRevokeSelf(document)
      } else {
        await onRevoke(document, sharingId, memberIndex)
      }
    } finally {
      setRevoking(false)
    }
  }, [
    document,
    isCurrentUser,
    isOwner,
    memberIndex,
    onRevoke,
    onRevokeSelf,
    sharingId
  ])

  return (
    <>
      {revoking && <Spinner />}
      {!shouldShowMenu && (
        <Typography variant="body2">
          {contactIsOwner
            ? t(`Share.status.${status}`)
            : t(`Share.type.${type}`)}
        </Typography>
      )}
      {shouldShowMenu && (
        <>
          <PermissionTypeMenu
            type={type ?? 'one-way'}
            onSetType={newType =>
              onSetMemberType(
                {
                  sharingId,
                  memberIndex,
                  type: type ?? 'one-way',
                  recipient
                },
                newType
              )
            }
          />
          <IconButton
            onClick={handleRevocation}
            size="small"
            className="u-ml-half"
            aria-label={t('Share.members.revoke')}
          >
            <Icon icon={CrossCircleOutline} />
          </IconButton>
        </>
      )}
    </>
  )
}

export default MemberRecipientPermissions
