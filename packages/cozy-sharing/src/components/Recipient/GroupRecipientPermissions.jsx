import React, { useState, useRef } from 'react'

import { Icon, CrossCircleOutline } from '@linagora/twake-icons'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuMobileHeader from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuMobileHeader'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { GroupAvatar } from '../Avatar/GroupAvatar'
import { permission } from './actions/permission'

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
  const buttonRef = useRef()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const shouldShowMenu =
    canManageMembers && !revoking && (isOwner || isUserInsideMembers)

  const toggleMenu = () => setMenuDisplayed(!isMenuDisplayed)
  const hideMenu = () => setMenuDisplayed(false)

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

  const actions = makeActions([permission], {
    t,
    type
  })

  return (
    <div className={className}>
      {revoking && <Spinner />}
      {!shouldShowMenu && (
        <Typography variant="body2">{t(`Share.type.${type}`)}</Typography>
      )}
      {shouldShowMenu && (
        <>
          <DropdownButton
            ref={buttonRef}
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={toggleMenu}
            textVariant="body2"
          >
            {t(`Share.type.${type}`)}
          </DropdownButton>
          <ActionsMenu
            ref={buttonRef}
            open={isMenuDisplayed}
            actions={actions}
            autoClose
            onClose={hideMenu}
          >
            <ActionsMenuMobileHeader>
              <ListItemIcon>
                <GroupAvatar size="m" color={color} />
              </ListItemIcon>
              <ListItemText
                primary={name}
                primaryTypographyProps={{ variant: 'h6' }}
              />
            </ActionsMenuMobileHeader>
          </ActionsMenu>
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
