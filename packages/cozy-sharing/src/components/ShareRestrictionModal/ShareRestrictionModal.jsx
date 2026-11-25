import { addDays } from 'date-fns'
import PropTypes from 'prop-types'
import React, { useContext, useState } from 'react'

import { Download, Icon } from '@linagora/twake-icons'
import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import Alert from 'cozy-ui/transpiled/react/Alert'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import {
  checkCanDownloadActivityReport,
  checkIsPermissionHasExpiresDate,
  checkIsPermissionHasPassword,
  checkIsReadOnlyPermissions,
  getPermissionExpiresDate
} from '../../helpers/permissions'
import { useSharingContext } from '../../hooks/useSharingContext'
import { ActivityReportContext } from './ActivityReportContext'
import { ShareRestrictionContentModal } from './ShareRestrictionContentModal'
import {
  copyToClipboard,
  updatePermissions,
  makeTTL,
  createPermissions,
  generateShareLinkFromFile
} from './helpers'

export const ShareRestrictionModal = ({ file, onClose }) => {
  const enableActivityReport = useContext(ActivityReportContext)
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const [password, setPassword] = useState('')
  const [isValidDate, setIsValidDate] = useState(true)
  const [isExpiredDate, setIsExpiredDate] = useState(false)
  const [isValidPassword, setIsValidPassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const {
    documentType,
    getDocumentPermissions,
    updateDocumentPermissions,
    shareByLink,
    getSharingLink,
    getOwner,
    getSharingById
  } = useSharingContext()

  const hasSharingLink = getSharingLink(file._id) !== null
  const permissions = getDocumentPermissions(file._id)
  const [linkPermission] = permissions
  const permissionId = linkPermission?.id
  const canDownloadReport = checkCanDownloadActivityReport({
    file,
    permissions,
    hasSharingLink
  })
  const isReadOnlyPermissions = checkIsReadOnlyPermissions(permissions)
  const hasPassword = checkIsPermissionHasPassword(permissions)
  const hasExpiresDate = checkIsPermissionHasExpiresDate(permissions)
  const expiresDate = getPermissionExpiresDate(permissions)
  const [defaultDate] = useState(() => addDays(new Date(), 30))
  const [draftDate, setDraftDate] = useState(null)
  const [hasChangedDate, setHasChangedDate] = useState(false)
  const [draftDateToggle, setDraftDateToggle] = useState(null)
  const [draftPasswordToggle, setPasswordToggle] = useState(null)
  const [draftActivityReportEnabled, setActivityReportEnabled] = useState(null)

  // Shared-drive permissions can arrive after the dialog opens.
  const selectedDate = hasChangedDate
    ? draftDate
    : expiresDate
      ? new Date(expiresDate)
      : defaultDate
  const dateToggle =
    draftDateToggle ??
    (permissions.length > 0
      ? hasExpiresDate
      : flag('sharing.date-toggle.enabled'))
  const passwordToggle = draftPasswordToggle ?? hasPassword
  const activityReportEnabled =
    draftActivityReportEnabled ??
    permissions[0]?.attributes?.activity_report_enabled === true
  const supportsActivityReport = enableActivityReport
  const editingRights =
    isReadOnlyPermissions || permissions.length === 0 ? 'readOnly' : 'write'

  const handleDownload = async () => {
    setDownloading(true)
    let objectUrl
    try {
      const response = await client
        .collection('io.cozy.permissions')
        .fetchStatistics(permissionId)
      // A direct download link cannot send the app's Authorization header.
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      objectUrl = downloadUrl
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'public-link-statistics.csv'
      document.body.appendChild(link)
      link.click()
      // WebKit may resolve the Blob URL after the click returns.
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 40 * 1000)
      objectUrl = null
      link.remove()
    } catch {
      showAlert({
        message: t('ActivityReport.downloadError'),
        severity: 'error',
        variant: 'filled'
      })
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setDownloading(false)
    }
  }

  const handleClick = async () => {
    const ttl = dateToggle ? makeTTL(selectedDate) : null
    const unchangedExpiry = !hasChangedDate && hasSharingLink && expiresDate
    if (
      (unchangedExpiry && new Date(unchangedExpiry).getTime() <= Date.now()) ||
      (dateToggle && (!ttl || ttl === '0s'))
    ) {
      setIsExpiredDate(true)
      return
    }
    setIsExpiredDate(false)
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
          preserveExpiration: !hasChangedDate,
          passwordToggle,
          password,
          editingRights,
          ...(supportsActivityReport && {
            activityReportEnabled: Boolean(dateToggle && activityReportEnabled)
          }),
          documentType,
          updateDocumentPermissions,
          showAlert
        }).then(([{ data: perms }]) => perms)
      : createPermissions({
          file,
          t,
          ttl,
          password,
          editingRights,
          ...(supportsActivityReport && {
            activityReportEnabled: Boolean(dateToggle && activityReportEnabled)
          }),
          documentType,
          shareByLink,
          showAlert
        }).then(({ data: perms }) => perms)

    const urlPromise = permsPromise.then(perms =>
      generateShareLinkFromFile({
        client,
        file,
        sharecode: perms.attributes.shortcodes.code,
        getOwner,
        getSharingById,
        documentType
      })
    )

    await copyToClipboard({ value: urlPromise, t, showAlert })
    try {
      // Observe the permission result so we can keep the modal open (and
      // preserve the user's date / password inputs) if
      // the permission round-trip failed. copyToClipboard swallows its
      // own errors so the await above always resolves.
      await permsPromise
    } catch {
      setLoading(false)
      return
    }
    onClose()
  }

  const handleDateToggle = value => {
    setHasChangedDate(true)
    setIsExpiredDate(false)
    setDraftDateToggle(value)
  }

  const handleSelectedDateChange = value => {
    setHasChangedDate(true)
    setIsExpiredDate(false)
    setDraftDate(value)
  }

  return (
    <ConfirmDialog
      open
      onClose={onClose}
      content={
        <>
          {isExpiredDate && (
            <Alert severity="error">{t('BoxDate.invalidExpiration')}</Alert>
          )}
          <ShareRestrictionContentModal
            file={file}
            activityReportEnabled={activityReportEnabled}
            isActivityReportShown={supportsActivityReport}
            setActivityReportEnabled={setActivityReportEnabled}
            // Date
            dateToggle={dateToggle}
            setDateToggle={handleDateToggle}
            setSelectedDate={handleSelectedDateChange}
            selectedDate={selectedDate}
            setIsValidDate={setIsValidDate}
            // Password
            isPasswordValid={isValidPassword}
            passwordToggle={passwordToggle}
            setPasswordToggle={setPasswordToggle}
            password={password}
            setPassword={setPassword}
            setIsValidPassword={setIsValidPassword}
          />
        </>
      }
      actions={
        <>
          {supportsActivityReport && (
            <Button
              className="u-mr-auto"
              variant="ghost"
              label={t('ActivityReport.download')}
              startIcon={<Icon icon={Download} size={18} />}
              disabled={!canDownloadReport}
              busy={downloading}
              onClick={handleDownload}
            />
          )}
          <Button
            label={t('ShareRestrictionModal.action.confirm')}
            disabled={!isValidDate || !isValidPassword}
            busy={loading}
            onClick={handleClick}
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
