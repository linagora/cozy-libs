import React, { useState } from 'react'

import { Icon, CrossCircleOutline } from '@linagora/twake-icons'
import ActionsMenuMobileHeader from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuMobileHeader'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import PermissionTypeMenu from './PermissionTypeMenu'
import { GroupAvatar } from '../Avatar/GroupAvatar'

const GroupRecipientPermissions = ({
  name,
  color,
  isOwner,
  canManageMembers = true,
  sharingId,
  groupIndex,
  read_only = false,
  className,
  isUserInsideMembers,
  document,
  onRevokeGroup,
  onLeaveGroup
}) => {
  const { t } = useI18n()
  const [revoking, setRevoking] = useState(false)

  const shouldShowMenu =
    canManageMembers && !revoking && (isOwner || isUserInsideMembers)

  const handleRevocation = async () => {
    setRevoking(true)
    if (isOwner) {
      await onRevokeGroup(document, sharingId, groupIndex)
    } else {
      await onLeaveGroup(document)
    }
    setRevoking(false)
  }

  const type = read_only ? 'one-way' : 'two-way'

  return (
    <div className={className}>
      {revoking && <Spinner />}
      {!shouldShowMenu && (
        <Typography variant="body2">{t(`Share.type.${type}`)}</Typography>
      )}
      {shouldShowMenu && (
        <>
          <PermissionTypeMenu
            value={type}
            roles={[{ value: type, label: t(`Share.type.${type}`) }]}
            onChange={() => {}}
            mobileHeader={
              <ActionsMenuMobileHeader>
                <ListItemIcon>
                  <GroupAvatar size="m" color={color} />
                </ListItemIcon>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{ variant: 'h6' }}
                />
              </ActionsMenuMobileHeader>
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
    </div>
  )
}

export { GroupRecipientPermissions }
