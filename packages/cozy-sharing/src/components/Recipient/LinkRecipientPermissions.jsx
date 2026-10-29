import PropTypes from 'prop-types'
import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import {
  makeActions,
  divider
} from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { isOnlyReadOnlyLinkAllowed } from '../../helpers/link'
import { checkIsReadOnlyPermissions } from '../../helpers/permissions'
import { WRITE_PERMS, READ_ONLY_PERMS } from '../ShareRestrictionModal/helpers'
import { revokeLink } from './actions/revokeLink'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'

const LinkRecipientPermissions = ({
  document,
  documentType,
  isReadOnly,
  permissions,
  onUpdateLinkPermissions,
  onRevokeLink
}) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const [isMenuDisplayed, setMenuDisplayed] = useState(false)

  const isReadOnlyPermissions = checkIsReadOnlyPermissions(permissions)
  const type = isReadOnlyPermissions ? 'one-way' : 'two-way'

  const toggleMenu = () => setMenuDisplayed(!isMenuDisplayed)
  const hideMenu = () => setMenuDisplayed(false)

  const handleSetType = newType => {
    const verbs = newType === 'one-way' ? READ_ONLY_PERMS : WRITE_PERMS
    onUpdateLinkPermissions(document, { verbs })
    hideMenu()
  }

  const handleRevocation = () => onRevokeLink(document)

  const actionsToShow = [setReadOnlySharedPermission]
  if (!isOnlyReadOnlyLinkAllowed({ documentType })) {
    actionsToShow.push(setReadWriteSharedPermission)
  }
  actionsToShow.push(divider, revokeLink)

  const actions = makeActions(actionsToShow, {
    t,
    type,
    setType: handleSetType,
    handleRevocation
  })

  const shouldShowMenu = !isReadOnly

  return (
    <>
      {!shouldShowMenu && (
        <Typography variant="body2">{t(`Share.type.${type}`)}</Typography>
      )}
      {shouldShowMenu && (
        <>
          <DropdownButton
            ref={buttonRef}
            textVariant="body2"
            onClick={toggleMenu}
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
        </>
      )}
    </>
  )
}

LinkRecipientPermissions.propTypes = {
  document: PropTypes.object.isRequired,
  documentType: PropTypes.string.isRequired,
  isReadOnly: PropTypes.bool,
  permissions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUpdateLinkPermissions: PropTypes.func.isRequired,
  onRevokeLink: PropTypes.func.isRequired
}

export default LinkRecipientPermissions
