import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossCircleOutlineIcon from 'cozy-ui/transpiled/react/Icons/CrossCircleOutline'
import { useI18n } from 'twake-i18n'

import { setReadOnlySharedPermission } from '../Recipient/actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from '../Recipient/actions/setReadWriteSharedPermission'

const ShareDriveRecipientPermissions = ({
  index,
  onSetType,
  type,
  onRevoke
}) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const [isMenuDisplayed, setMenuDisplayed] = useState(false)

  const toggleMenu = () => setMenuDisplayed(!isMenuDisplayed)
  const hideMenu = () => setMenuDisplayed(false)

  const handleRevocation = async () => {
    onRevoke(index)
    hideMenu()
  }

  const setType = async newType => {
    if (newType !== type) {
      onSetType(index, newType)
    }
    hideMenu()
  }

  const actions = makeActions(
    [setReadOnlySharedPermission, setReadWriteSharedPermission],
    {
      t,
      type,
      setType
    }
  )

  return (
    <div>
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
      />
      <IconButton
        onClick={handleRevocation}
        size="small"
        className="u-ml-half"
        aria-label={t('Share.members.revoke')}
      >
        <Icon icon={CrossCircleOutlineIcon} />
      </IconButton>
    </div>
  )
}

export default ShareDriveRecipientPermissions
