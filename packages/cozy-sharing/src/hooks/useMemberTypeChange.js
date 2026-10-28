import { useState } from 'react'

import minilog from 'cozy-minilog'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { useMemberPermissionType } from './useMemberPermissionType'
import { isDowngradeConfirmationNeeded } from '../helpers/permissions'

const log = minilog('useMemberTypeChange')

/**
 * Changes the permission type of the members of a document's sharing, and
 * alerts when it fails
 *
 * @param {object} document - Shared document
 * @param {object} [options]
 * @param {boolean} [options.shouldFetchPath] - Whether to fetch the document
 * path, needed to know the shared parent
 * @returns {{ changeMemberType: Function, isDowngradeDialogOpen: boolean, downgradedRecipient: object|undefined, sharedParentName: string, confirmDowngrade: Function, cancelDowngrade: Function }}
 * `changeMemberType({ sharingId, memberIndex, type, recipient }, newType)`
 * opens the downgrade dialog instead of downgrading a member when a
 * confirmation is needed, until `confirmDowngrade` or `cancelDowngrade` is called
 */
export const useMemberTypeChange = (
  document,
  { shouldFetchPath = true } = {}
) => {
  const { t } = useI18n()
  const { showAlert } = useAlert()
  const { isInsideSharedParent, sharedParentName, setMemberType } =
    useMemberPermissionType(document, { shouldFetchPath })
  const [pendingDowngrade, setPendingDowngrade] = useState(null)

  const applyMemberType = async (member, newType, options) => {
    try {
      await setMemberType(member, newType, options)
    } catch (error) {
      log.error('Failed to change member permission type', error)
      showAlert({
        message: t('Share.members.error.changePermission'),
        severity: 'error',
        variant: 'filled'
      })
    }
  }

  const changeMemberType = (member, newType) => {
    if (
      isDowngradeConfirmationNeeded({
        currentType: member.type,
        newType,
        isInsideSharedParent
      })
    ) {
      setPendingDowngrade({ member, newType })
      return
    }
    applyMemberType(member, newType)
  }

  const confirmDowngrade = () => {
    setPendingDowngrade(null)
    applyMemberType(pendingDowngrade.member, pendingDowngrade.newType, {
      withAncestors: true
    })
  }

  const cancelDowngrade = () => setPendingDowngrade(null)

  return {
    changeMemberType,
    isDowngradeDialogOpen: pendingDowngrade !== null,
    downgradedRecipient: pendingDowngrade?.member.recipient,
    sharedParentName,
    confirmDowngrade,
    cancelDowngrade
  }
}
