import React, { useState, useCallback } from 'react'

import { Icon, CrossCircleOutline } from '@linagora/twake-icons'
import { useClient } from 'cozy-client'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { PermissionTypeMenu } from './PermissionTypeMenu'

const MemberRecipientPermissions = ({
  isOwner,
  canManageSharing = isOwner,
  canManageMembers = true,
  status,
  instance,
  type,
  document,
  onRevoke,
  onRevokeSelf,
  sharingId,
  memberIndex
}) => {
  const { t } = useI18n()
  const client = useClient()

  const [revoking, setRevoking] = useState(false)

  const instanceMatchesClient =
    instance !== undefined && instance === client.options.uri
  const contactIsOwner = status === 'owner'
  const shouldShowMenu =
    canManageMembers &&
    !revoking &&
    !contactIsOwner &&
    ((instanceMatchesClient && !isOwner) || canManageSharing)

  const handleRevocation = useCallback(async () => {
    setRevoking(true)
    try {
      if (instanceMatchesClient && !isOwner) {
        await onRevokeSelf(document)
      } else {
        await onRevoke(document, sharingId, memberIndex)
      }
    } finally {
      setRevoking(false)
    }
  }, [
    document,
    instanceMatchesClient,
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
            sharingId={sharingId}
            memberIndex={memberIndex}
            type={type ?? 'one-way'}
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
