import React, { useState, useRef, useCallback } from 'react'

import { useClient } from 'cozy-client'
import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import {
  makeActions,
  divider
} from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { revokeMember } from './actions/revokeMember'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import { useSharingContext } from '../../hooks/useSharingContext'

const log = minilog('MemberRecipientPermissions')

const MemberRecipientPermissions = ({
  isOwner,
  isSharedDrive,
  status,
  instance,
  type,
  document,
  className,
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
      hideMenu()
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
    [
      setReadOnlySharedPermission,
      setReadWriteSharedPermission,
      divider,
      revokeMember
    ],
    {
      client,
      t,
      type: type ?? 'one-way',
      isOwner,
      isSharedDrive,
      setType,
      handleRevocation
    }
  )

  return (
    <div className={className}>
      {revoking && <Spinner />}
      {!shouldShowMenu && !revoking && (
        <Typography variant="body2">
          {t(`Share.status.${status}`).toLowerCase()}
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
      )}
    </div>
  )
}

export default MemberRecipientPermissions
