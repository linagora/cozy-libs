import PropTypes from 'prop-types'
import React, { useCallback, useRef, useState } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import { useI18n } from 'twake-i18n'

import { setReadOnlySharedPermission } from './actions/setReadOnlySharedPermission'
import { setReadWriteSharedPermission } from './actions/setReadWriteSharedPermission'

const PermissionTypeMenu = ({ type, onSetType }) => {
  const { t } = useI18n()
  const buttonRef = useRef()

  const [isMenuDisplayed, setMenuDisplayed] = useState(false)

  const hideMenu = useCallback(() => {
    setMenuDisplayed(false)
  }, [])

  const setType = useCallback(
    newType => {
      hideMenu()
      if (newType === type) return
      onSetType(newType)
    },
    [hideMenu, onSetType, type]
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

PermissionTypeMenu.propTypes = {
  type: PropTypes.oneOf(['one-way', 'two-way']),
  onSetType: PropTypes.func.isRequired
}

export default PermissionTypeMenu
