import React, { useState, useRef, useCallback } from 'react'

import { useClient } from 'cozy-client'
import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossCircleOutlineIcon from 'cozy-ui/transpiled/react/Icons/CrossCircleOutline'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import { useSharingContext } from '../../hooks/useSharingContext'

const log = minilog('MemberRecipientPermissions')

const MemberRecipientPermissions = ({
  isOwner,
  isReadOnly,
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
  const buttonRef = useRef()
  const client = useClient()
  const { updateSharingMemberType } = useSharingContext()
  const { showAlert } = useAlert()

  const [revoking, setRevoking] = useState(false)
  const [isMenuDisplayed, setMenuDisplayed] = useState(false)

  const instanceMatchesClient =
    instance !== undefined && instance === client.options.uri
  const contactIsOwner = status === 'owner'
  const shouldShowMenu =
    !isReadOnly &&
    !revoking &&
    !contactIsOwner &&
    ((instanceMatchesClient && !isOwner) || isOwner)

  const toggleMenu = useCallback(() => {
    setMenuDisplayed(displayed => !displayed)
  }, [])
  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const handleRevocation = useCallback(async () => {
    setRevoking(true)
    try {
      if (isOwner) {
        await onRevoke(document, sharingId, memberIndex)
      } else {
        await onRevokeSelf(document)
      }
    } finally {
      setRevoking(false)
    }
  }, [isOwner, onRevoke, onRevokeSelf, document, sharingId, memberIndex])

  const setType = useCallback(
    async newType => {
      if (newType === type) {
        hideMenu()
        return
      }
      hideMenu()
      try {
        await updateSharingMemberType(sharingId, memberIndex, newType)
      } catch (error) {
        log.error('Failed to change member permission type', error)
        showAlert({
          message: t('Share.members.error.changePermission'),
          severity: 'error',
          variant: 'filled'
        })
      }
    },
    [
      hideMenu,
      memberIndex,
      sharingId,
      showAlert,
      t,
      type,
      updateSharingMemberType
    ]
  )

  const actions = makeActions(
    [setReadOnlySharedPermission, setReadWriteSharedPermission],
    {
      t,
      type: type ?? 'one-way',
      setType
    }
  )

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
        </>
      )}
    </>
  )
}

export default MemberRecipientPermissions
