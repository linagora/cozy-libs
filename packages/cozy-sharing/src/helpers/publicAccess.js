import { isOnlyReadOnlyLinkAllowed } from './link'
import {
  checkIsPermissionHasPassword,
  checkIsReadOnlyPermissions,
  getPermissionExpiresDate
} from './permissions'

const getLinkStatusKey = ({ permissions, hasPassword, expiresDate }) => {
  if (hasPassword && expiresDate) return 'passwordAndExpires'
  if (hasPassword) return 'password'
  if (expiresDate) return 'expires'
  return checkIsReadOnlyPermissions(permissions) ? 'view' : 'edit'
}

/**
 * Status of the public link, as shown in the Public access block
 *
 * @param {object} params
 * @param {string|null} params.link - Share link of the document, if any
 * @param {Array<object>} params.permissions - Permissions of the share link
 * @returns {{ key: 'restricted'|'view'|'edit'|'password'|'expires'|'passwordAndExpires', expiresDate: string|null }}
 */
export const getPublicAccessStatus = ({ link, permissions }) => {
  if (!link) return { key: 'restricted', expiresDate: null }

  const expiresDate = getPermissionExpiresDate(permissions) ?? null
  const hasPassword = checkIsPermissionHasPassword(permissions)
  const key = getLinkStatusKey({ permissions, hasPassword, expiresDate })

  return { key, expiresDate }
}

/**
 * Whether the user can only create viewer links on the document. The stack
 * refuses editor links to read-only members of a shared drive. A `driveId`
 * can outlive its shared drive: the owner then keeps
 * editor links.
 *
 * @param {object} params
 * @param {string} params.documentType - Type of the shared document
 * @param {object} params.document - Shared document
 * @param {Function} params.hasWriteAccess - From the sharing context
 * @param {Function} params.getSharingById - From the sharing context
 * @returns {boolean}
 */
export const isViewerOnlyLink = ({
  documentType,
  document,
  hasWriteAccess,
  getSharingById
}) => {
  if (isOnlyReadOnlyLinkAllowed({ documentType })) return true
  if (!document.driveId || !getSharingById(document.driveId)) return false
  return !hasWriteAccess(document._id, document.driveId)
}
