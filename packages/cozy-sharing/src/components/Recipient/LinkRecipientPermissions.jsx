import PropTypes from 'prop-types'
import React, { useState, useRef } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import {
  makeActions,
  divider
} from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useI18n } from 'twake-i18n'

import { revokeLink } from './actions/revokeLink'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import { isOnlyReadOnlyLinkAllowed } from '../../helpers/link'
import { checkIsReadOnlyPermissions } from '../../helpers/permissions'
import { useSharingContext } from '../../hooks/useSharingContext'
import { WRITE_PERMS, READ_ONLY_PERMS } from '../ShareRestrictionModal/helpers'

const LinkRecipientPermissions = ({ className, document }) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const {
    updateDocumentPermissions,
    revokeSharingLink,
    documentType,
    getDocumentPermissions
  } = useSharingContext()

  const permissions = getDocumentPermissions(document._id)
  const isReadOnlyPermissions = checkIsReadOnlyPermissions(permissions)
  const type = isReadOnlyPermissions ? 'one-way' : 'two-way'

  const toggleMenu = () => setMenuDisplayed(!isMenuDisplayed)
  const hideMenu = () => setMenuDisplayed(false)

  const handleSetType = newType => {
    const verbs = newType === 'one-way' ? READ_ONLY_PERMS : WRITE_PERMS
    updateDocumentPermissions(document, { verbs })
  }

  const handleRevocation = () => revokeSharingLink(document)

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

  return (
    <div className={className}>
      <>
        <DropdownButton
          ref={buttonRef}
          textVariant="body2"
          onClick={toggleMenu}
        >
          {t(`Share.type.${type}`).toLowerCase()}
        </DropdownButton>
        <ActionsMenu
          ref={buttonRef}
          open={isMenuDisplayed}
          actions={actions}
          autoClose
          onClose={hideMenu}
        />
      </>
    </div>
  )
}

LinkRecipientPermissions.propTypes = {
  className: PropTypes.string,
  document: PropTypes.object.isRequired
}

export default LinkRecipientPermissions
