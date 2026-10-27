import PropTypes from 'prop-types'
import React, { useCallback, useRef, useState } from 'react'

import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './DowngradePermissionConfirmDialog'
import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'

const log = minilog('PermissionTypeMenu')

const PermissionTypeMenu = ({
  type,
  document,
  recipient,
  isInsideSharedParent,
  sharedParentName,
  onSetType
}) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const { showAlert } = useAlert()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)
  const [pendingType, setPendingType] = useState(null)

  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const applyType = useCallback(
    async (newType, options) => {
      try {
        await onSetType(newType, options)
      } catch (error) {
        log.error('Failed to change member permission type', error)
        showAlert({
          message: t('Share.members.error.changePermission'),
          severity: 'error',
          variant: 'filled'
        })
      }
    },
    [onSetType, showAlert, t]
  )

  // Downgrading to viewer on a folder inside a shared parent also reduces
  // the member's rights on the parent: require explicit confirmation first.
  const shouldConfirmDowngrade = type === 'two-way' && isInsideSharedParent

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
          sharedParentName={sharedParentName}
          onCancel={handleCancelDowngrade}
          onConfirm={handleConfirmDowngrade}
        />
      )}
    </>
  )
}

PermissionTypeMenu.propTypes = {
  type: PropTypes.oneOf(['one-way', 'two-way']),
  document: PropTypes.object,
  recipient: PropTypes.object,
  isInsideSharedParent: PropTypes.bool,
  sharedParentName: PropTypes.string,
  onSetType: PropTypes.func.isRequired
}

export default PermissionTypeMenu
