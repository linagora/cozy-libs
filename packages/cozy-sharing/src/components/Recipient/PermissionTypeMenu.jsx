import React, { useCallback, useRef, useState } from 'react'

import { useClient } from 'cozy-client'
import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import withLocales from '../../hoc/withLocales'
import { useFetchDocumentPath } from '../../hooks/useFetchDocumentPath'
import { useSharingContext } from '../../hooks/useSharingContext'

const log = minilog('PermissionTypeMenu')

const PermissionTypeMenuComponent = ({
  sharingId,
  memberIndex,
  type,
  document,
  recipient
}) => {
  const { t } = useI18n()
  const client = useClient()
  const buttonRef = useRef()
  const { hasSharedParent, updateSharingMemberType } = useSharingContext()
  const { showAlert } = useAlert()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [pendingType, setPendingType] = useState(null)

  const documentPath = useFetchDocumentPath(client, document)

  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const applyType = useCallback(
    async (newType, { withAncestors = false } = {}) => {
      try {
        if (withAncestors) {
          // Ancestors first: only the target's own update refetches its
          // effective recipients, which must already see them downgraded.
          const ancestors = (recipient?.sources || []).filter(
            s => s.kind === 'ancestor' && !s.read_only
          )
          for (const ancestor of ancestors) {
            await updateSharingMemberType(
              ancestor.sharing_id,
              ancestor.member_index,
              newType
            )
          }
        }
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
    [memberIndex, recipient, sharingId, showAlert, t, updateSharingMemberType]
  )

  // Downgrading to viewer on a folder inside a shared parent also reduces
  // the member's rights on the parent: require explicit confirmation first.
  const shouldConfirmDowngrade =
    type === 'two-way' &&
    Boolean(documentPath) &&
    hasSharedParent?.(documentPath)

  const setType = useCallback(
    newType => {
      hideMenu()
      if (newType === type) return
      if (newType === 'one-way' && shouldConfirmDowngrade) {
        setPendingType(newType)
        return
      }
      applyType(newType)
    },
    [applyType, hideMenu, shouldConfirmDowngrade, type]
  )

  const handleConfirmDowngrade = useCallback(() => {
    const newType = pendingType
    setPendingType(null)
    if (newType) applyType(newType, { withAncestors: true })
  }, [applyType, pendingType])

  const handleCancelDowngrade = useCallback(() => {
    setPendingType(null)
  }, [])

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
      <DropdownButton
        ref={buttonRef}
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={() => setMenuDisplayed(true)}
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
      {pendingType && (
        <DowngradePermissionConfirmDialog
          document={document}
          recipient={recipient}
          onCancel={handleCancelDowngrade}
          onConfirm={handleConfirmDowngrade}
        />
      )}
    </>
  )
}

export const PermissionTypeMenu = withLocales(PermissionTypeMenuComponent)
