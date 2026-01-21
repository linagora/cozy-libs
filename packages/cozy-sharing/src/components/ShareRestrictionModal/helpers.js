import { generateWebLink } from 'cozy-client'
import minilog from 'cozy-minilog'

import { getAppSlugFromDocumentType } from '../../helpers/link'

const log = minilog('ShareRestrictionModal/helpers')

export const WRITE_PERMS = ['GET', 'POST', 'PUT', 'PATCH']
export const READ_ONLY_PERMS = ['GET']

/**
 * Create a sharing link for a file with specified options
 * @param {object} options
 * @param {object} options.client - CozyClient instance
 * @param {object} options.file - File to share
 * @param {string} options.documentType - Type of the document
 * @param {Function} options.shareByLink - Function to create permissions
 * @param {Function} options.t - Translation function
 * @param {Function} options.showAlert - Function to display an alert
 * @param {Date|string} [options.ttl] - Time to live of the sharing link
 * @param {'readOnly'|'write'} [options.editingRights] - Editing rights
 * @param {string} [options.password] - Password
 * @param {boolean} [options.withTTL] - Whether to add a default TTL
 * @returns {Promise<string|null>} - The generated web link or null if permissions creation fails
 */
export const createSharingLink = async ({
  client,
  file,
  documentType,
  shareByLink,
  t,
  ttl,
  editingRights = 'readOnly',
  password,
  showAlert
}) => {
  const permsResult = await createPermissions({
    file,
    t,
    ttl,
    editingRights,
    password,
    documentType,
    shareByLink,
    showAlert
  })
  if (!permsResult?.data?.attributes?.shortcodes?.code) {
    return null
  }
  const { data: perms } = permsResult
  return generateWebLink({
    cozyUrl: client.getStackClient().uri,
    searchParams: [['sharecode', perms.attributes.shortcodes.code]],
    pathname: '/public',
    slug: getAppSlugFromDocumentType({ documentType }),
    subDomainType: client.capabilities.flat_subdomains ? 'flat' : 'nested'
  })
}

/**
 * Copy a string to the clipboard
 *
 * @param {string} value - The string saved to the clipboard
 * @param {object} [options]
 * @param {number} options.t - Translation function
 * @param {Function} options.showAlert - Function to display an alert
 */
export const copyToClipboard = async (value, { t, showAlert } = {}) => {
  if (!value) return false
  try {
    await navigator.clipboard.writeText(value)
    showAlert({
      message: t('copyReminderContent.success'),
      severity: 'success',
      variant: 'filled'
    })
  } catch (error) {
    showAlert({
      message: t('copyReminderContent.error'),
      severity: 'error',
      variant: 'filled'
    })
    log.error(
      "Error in 'copyToClipboard' function when trying to copy to clipboard",
      error
    )
  }
}

/**
 * Make a TTL string from a date
 * @param {Date|string} selectedDate
 * @returns {string} - TTL string in seconds (e.g. '1234s')
 */
export const makeTTL = selectedDate => {
  if (!selectedDate) return
  try {
    let selectedDateConverted = selectedDate
    if (typeof selectedDate === 'string') {
      selectedDateConverted = new Date(selectedDate)
      if (selectedDateConverted?.toString() === 'Invalid Date') {
        throw new Error(`Invalid date: ${selectedDate}`)
      }
    }
    if (selectedDateConverted instanceof Date) {
      const now = new Date()
      const ttl =
        selectedDateConverted > now
          ? `${Math.round((selectedDateConverted - now) / 1000)}s`
          : undefined
      return ttl
    }
    throw new Error(`Invalid date: ${selectedDate}`)
  } catch (error) {
    log.error(error)
    return
  }
}

/**
 * createPermissions - Create the permissions of a file
 * @param {object} options
 * @param {import('cozy-client/types/types').IOCozyFile} options.file File to update permissions
 * @param {Function} options.t i18n function
 * @param {Date|string} options.ttl - Time to live of the sharing link
 * @param {string} options.password - Password
 * @param {'readOnly'|'write'} options.editingRights - Editing rights
 * @param {string} options.documentType - Type of the document
 * @param {Function} options.shareByLink - Function to create permissions
 * @param {Function} options.showAlert - Function to display an alert
 */
export const createPermissions = async ({
  file,
  t,
  ttl,
  password,
  editingRights,
  documentType,
  shareByLink,
  showAlert
}) => {
  try {
    const verbs = editingRights === 'readOnly' ? READ_ONLY_PERMS : WRITE_PERMS
    return shareByLink(file, { verbs, ttl, password })
  } catch (err) {
    showAlert({
      message: t(`${documentType}.share.shareByLink.permserror`),
      severity: 'error',
      variant: 'filled'
    })
    log.error(
      "Error in 'readOnlyPermissionLink' function when trying to change permission",
      err
    )
  }
}

/**
 * updatePermissions - Updates the permissions of a file
 * @param {object} options
 * @param {import('cozy-client/types/types').IOCozyFile} options.file File to update permissions
 * @param {Function} options.t i18n function
 * @param {boolean} options.dateToggle - Expiration date toggle
 * @param {Date|null} options.selectedDate - Expiration date
 * @param {boolean} options.passwordToggle - Password toggle
 * @param {string} options.password - Password
 * @param {string} options.documentType - Type of the document
 * @param {'readOnly'|'write'} options.editingRights - Editing rights
 * @param {Function} options.updateDocumentPermissions - Function to update permissions
 * @param {Function} options.showAlert - Function to display an alert
 */
export const updatePermissions = async ({
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
}) => {
  try {
    const expiresAt = dateToggle ? selectedDate?.toISOString() || undefined : ''
    const ensurePassword = passwordToggle ? password || undefined : ''
    const verbs = editingRights === 'readOnly' ? READ_ONLY_PERMS : WRITE_PERMS
    return updateDocumentPermissions(file, {
      verbs,
      expiresAt,
      password: ensurePassword
    })
  } catch (err) {
    showAlert({
      message: t(`${documentType}.share.shareByLink.permserror`),
      severity: 'error',
      variant: 'filled'
    })
    log.error(
      "Error in 'updateDocumentPermissions' function when trying to change permission",
      err
    )
  }
}

/**
 * revokePermissions - Revokes the permissions of a file
 * @param {object} options
 * @param {import('cozy-client/types/types').IOCozyFile} options.file File to revoke permissions
 * @param {Function} options.t i18n function
 * @param {string} options.documentType - Type of the document
 * @param {Function} options.revokeSharingLink - Function to revoke permissions
 * @param {Function} options.showAlert - Function to display an alert
 */
export const revokePermissions = async ({
  file,
  t,
  documentType,
  revokeSharingLink,
  showAlert
}) => {
  try {
    return revokeSharingLink(file)
  } catch (err) {
    showAlert({
      message: t(`${documentType}.share.error.revoke`),
      severity: 'error',
      variant: 'filled'
    })
    log.error(
      "Error in 'revokePermissions' function when trying to revoke sharing link",
      err
    )
  }
}
