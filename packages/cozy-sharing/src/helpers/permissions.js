import get from 'lodash/get'

import { models } from 'cozy-client'

export const checkIsReadOnlyPermissions = permissions => {
  const permissionCategories = get(
    permissions,
    '[0].attributes.permissions',
    {}
  )
  return (
    Object.values(permissionCategories).filter(permissionCategory =>
      models.permission.isReadOnly(permissionCategory)
    ).length > 0
  )
}

export const checkIsPermissionHasExpiresDate = permissions => {
  return Boolean(permissions?.[0]?.attributes?.expires_at)
}

export const getPermissionExpiresDate = permissions => {
  return permissions?.[0]?.attributes?.expires_at
}

export const checkIsPermissionHasPassword = permissions => {
  return Boolean(permissions?.[0]?.attributes?.password)
}

/**
 * Downgrading a member to viewer on a folder inside a shared parent also
 * reduces their rights on the parent, so it needs an explicit confirmation
 *
 * @param {object} params
 * @param {string} params.currentType - Current permission type of the member
 * @param {string} params.newType - Permission type picked for the member
 * @param {boolean} params.isInsideSharedParent - Whether the folder is inside a shared parent
 * @returns {boolean}
 */
export const isDowngradeConfirmationNeeded = ({
  currentType,
  newType,
  isInsideSharedParent
}) => currentType === 'two-way' && newType === 'one-way' && isInsideSharedParent
