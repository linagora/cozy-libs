import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuMobileHeader from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuMobileHeader'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossCircleOutlineIcon from 'cozy-ui/transpiled/react/Icons/CrossCircleOutline'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import { useI18n } from 'twake-i18n'

import { permission } from './actions/permission'
import { useSharingContext } from '../../hooks/useSharingContext'
import { GroupAvatar } from '../Avatar/GroupAvatar'

const GroupRecipientPermissions = ({
  name,
  isOwner,
  sharingId,
  groupIndex,
  read_only = false,
  className,
  isUserInsideMembers,
  document
}) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const { revokeGroup, revokeSelf } = useSharingContext()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const shouldShowMenu = !revoking && (isOwner || isUserInsideMembers)

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

  const actions = makeActions([permission], {
    t,
    type
  })

  return (
    <div className={className}>
      {revoking && <Spinner />}
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
            <Icon icon={CrossCircleOutlineIcon} />
          </IconButton>
        </>
      )}
    </div>
  )
}

export { GroupRecipientPermissions }
