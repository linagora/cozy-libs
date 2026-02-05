import React, { useState, useRef } from 'react'
import { useI18n } from 'twake-i18n'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'

import { remove } from '../../actions/delete'
import { rename } from '../../actions/rename'
import { share } from '../../actions/share'

const ConversationActions = ({ buttonClassName }) => {
  const { t } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const anchorRef = useRef(null)

  const toggleMenu = e => {
    e?.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const actions = makeActions([share, rename, remove], { t })

  return (
    <>
      <IconButton
        className={buttonClassName}
        size="small"
        ref={anchorRef}
        onClick={toggleMenu}
      >
        <Icon icon={DotsIcon} />
      </IconButton>
      <ActionsMenu
        ref={anchorRef}
        open={isMenuOpen}
        actions={actions}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        autoClose
        onClose={toggleMenu}
      />
    </>
  )
}

export default ConversationActions
