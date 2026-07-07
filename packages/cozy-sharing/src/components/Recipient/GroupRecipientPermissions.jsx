import React, { useState, useRef } from 'react'

import { Icon, CrossCircleOutline } from '@linagora/twake-icons'
import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuMobileHeader from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuMobileHeader'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import { useSharingContext } from '../../hooks/useSharingContext'
import { GroupAvatar } from '../Avatar/GroupAvatar'

const log = minilog('GroupRecipientPermissions')

const GroupRecipientPermissions = ({
  name,
  isOwner,
  isReadOnly,
  sharingId,
  groupIndex,
  read_only = false,
  className,
  isUserInsideMembers,
  document
}) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const { updateSharingGroupType, revokeGroup, revokeSelf } =
    useSharingContext()
  const { showAlert } = useAlert()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const shouldShowMenu =
    !isReadOnly && !revoking && (isOwner || isUserInsideMembers)

  const toggleMenu = () => setMenuDisplayed(!isMenuDisplayed)
  const hideMenu = () => setMenuDisplayed(false)

  const handleRevocation = async () => {
    setRevoking(true)
    if (isOwner) {
      await revokeGroup(document, sharingId, groupIndex)
    } else {
      await revokeSelf(document)
    }
    setRevoking(false)
  }

  const type = read_only ? 'one-way' : 'two-way'

  const setType = async newType => {
    if (newType === type) {
      hideMenu()
      return
    }
    hideMenu()
    try {
      await updateSharingGroupType(sharingId, groupIndex, newType)
    } catch (error) {
      log.error('Failed to change group permission type', error)
      showAlert({
        message: t('Share.members.error.changePermission'),
        severity: 'error',
        variant: 'filled'
      })
    }
  }

  const actions = makeActions(
    [setReadOnlySharedPermission, setReadWriteSharedPermission],
    {
      t,
      type: type ?? 'one-way',
      setType
    }
  )

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
                <GroupAvatar size="m" />
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
