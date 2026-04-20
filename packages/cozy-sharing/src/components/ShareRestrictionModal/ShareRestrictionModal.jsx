import { addDays } from 'date-fns'
import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { generateWebLink, useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { ShareRestrictionContentModal } from './ShareRestrictionContentModal'
import {
  copyToClipboard,
  updatePermissions,
  makeTTL,
  revokePermissions,
  createPermissions
} from './helpers'
import { getAppSlugFromDocumentType } from '../../helpers/link'
import {
  checkIsPermissionHasExpiresDate,
  checkIsPermissionHasPassword,
  checkIsReadOnlyPermissions,
  getPermissionExpiresDate
} from '../../helpers/permissions'
import { useSharingContext } from '../../hooks/useSharingContext'

const PASSWORD_MIN_LENGTH = 4

export const ShareRestrictionModal = ({ file, onClose }) => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const [password, setPassword] = useState('')
  const [isValidDate, setIsValidDate] = useState(true)
  const [isValidPassword, setIsValidPassword] = useState(true)
  const [loading, setLoading] = useState(false)

  const {
    documentType,
    getDocumentPermissions,
    updateDocumentPermissions,
    shareByLink,
    getSharingLink,
    revokeSharingLink
  } = useSharingContext()

  const hasSharingLink = getSharingLink(file._id) !== null
  const permissions = getDocumentPermissions(file._id)
  const isReadOnlyPermissions = checkIsReadOnlyPermissions(permissions)
  const hasPassword = checkIsPermissionHasPassword(permissions)
  const hasExpiresDate = checkIsPermissionHasExpiresDate(permissions)
  const expiresDate = getPermissionExpiresDate(permissions)
  const defaultDate = expiresDate
    ? new Date(expiresDate)
    : addDays(new Date(), 30)

  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [dateToggle, setDateToggle] = useState(
    permissions.length > 0
      ? hasExpiresDate
      : flag('sharing.date-toggle.enabled')
  )
  const [passwordToggle, setPasswordToggle] = useState(hasPassword)
  const [editingRights, setEditingRights] = useState(
    isReadOnlyPermissions || permissions.length === 0 ? 'readOnly' : 'write'
  )

  const helperTextPassword = !isValidPassword
    ? t('ShareRestrictionModal.invalidPasswordMessage', {
        smart_count: PASSWORD_MIN_LENGTH - password.length
      })
    : null

  const handleClick = async () => {
    setLoading(true)
    // The clipboard write must be initiated synchronously within the click
    // handler for Safari to honor the user gesture; we pass a pending blob
    // whose content resolves after the permission round-trip.
    const permsPromise = hasSharingLink
      ? updatePermissions({
          file,
          t,
          dateToggle,
          selectedDate,
          passwordToggle,
          password,
          editingRights,
          documentType,
          updateDocumentPermissions,
          showAlert
        }).then(([{ data: perms }]) => perms)
      : createPermissions({
          file,
          t,
          ttl: makeTTL(dateToggle && selectedDate),
          password,
          editingRights,
          documentType,
          shareByLink,
          showAlert
        }).then(({ data: perms }) => perms)

    const urlPromise = permsPromise.then(perms =>
      generateWebLink({
        cozyUrl: client.getStackClient().uri,
        searchParams: [['sharecode', perms.attributes.shortcodes.code]],
        pathname: '/public',
        slug: getAppSlugFromDocumentType({ documentType }),
        subDomainType: client.capabilities.flat_subdomains ? 'flat' : 'nested'
      })
    )

    await copyToClipboard(urlPromise, { t, showAlert })
    try {
      // Observe the permission result so we can keep the modal open (and
      // preserve the user's date / password / editing-rights inputs) if
      // the permission round-trip failed. copyToClipboard swallows its
      // own errors so the await above always resolves.
      await permsPromise
    } catch {
      setLoading(false)
      return
    }
    onClose()
  }

  const handleRevokeLink = async () => {
    setLoading(true)
    await revokePermissions({
      file,
      t,
      documentType,
      revokeSharingLink,
      showAlert
    })
    onClose()
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      content={
        <ShareRestrictionContentModal
          file={file}
          // Date
          dateToggle={dateToggle}
          setDateToggle={setDateToggle}
          setSelectedDate={setSelectedDate}
          selectedDate={selectedDate}
          setIsValidDate={setIsValidDate}
          // Password
          helperTextPassword={helperTextPassword}
          passwordToggle={passwordToggle}
          setPasswordToggle={setPasswordToggle}
          password={password}
          setPassword={setPassword}
          setIsValidPassword={setIsValidPassword}
          // Editing rights
          editingRights={editingRights}
          setEditingRights={setEditingRights}
        />
      }
      actions={
        <>
          {hasSharingLink && (
            <Button
              label={t('Share.permissionLink.deactivate')}
              variant="secondary"
              color="error"
              startIcon={<Icon icon={TrashIcon} />}
              onClick={handleRevokeLink}
              busy={loading}
            />
          )}
          <Button
            label={t('ShareRestrictionModal.action.confirm')}
            onClick={handleClick}
            disabled={!isValidDate || !isValidPassword}
            busy={loading}
          />
        </>
      }
    />
  )
}

ShareRestrictionModal.propTypes = {
  file: PropTypes.object.isRequired,
  onClose: PropTypes.func
}
