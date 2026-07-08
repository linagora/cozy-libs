import React, { useCallback, useRef, useState } from 'react'

import minilog from 'cozy-minilog'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'

const log = minilog('PermissionTypeMenu')

const PermissionTypeMenuComponent = ({ sharingId, memberIndex, type }) => {
  const { t } = useI18n()
  const buttonRef = useRef()
  const { updateSharingMemberType } = useSharingContext()
  const { showAlert } = useAlert()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)

  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const setType = useCallback(
    async newType => {
      hideMenu()
      if (newType !== type) {
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
    </>
  )
}

export const PermissionTypeMenu = withLocales(PermissionTypeMenuComponent)
