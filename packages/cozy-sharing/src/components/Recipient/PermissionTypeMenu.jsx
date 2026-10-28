import PropTypes from 'prop-types'
import React, { useState } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ActionsMenuWrapper from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuWrapper'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radios from 'cozy-ui/transpiled/react/Radios'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const PermissionTypeMenu = ({ value, roles, onChange, mobileHeader }) => {
  const { isMobile } = useBreakpoints()
  const [anchorEl, setAnchorEl] = useState(null)

  const label = roles.find(role => role.value === value)?.label

  const handleRoleClick = role => {
    if (role.value !== value) onChange(role.value)
  }

  return (
    <>
      <DropdownButton
        aria-controls="simple-menu"
        aria-haspopup="true"
        onClick={event => setAnchorEl(event.currentTarget)}
        textVariant="body2"
      >
        {label}
      </DropdownButton>
      <ActionsMenuWrapper
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        keepMounted
        autoClose
        onClose={() => setAnchorEl(null)}
      >
        {/* The header renders nothing on desktop but would still take the initial focus of the menu */}
        {isMobile && mobileHeader}
        {roles.map(role => (
          <ActionsMenuItem
            key={role.value}
            onClick={() => handleRoleClick(role)}
          >
            <ListItemIcon>
              <Radios checked={role.value === value} />
            </ListItemIcon>
            <ListItemText primary={role.label} />
          </ActionsMenuItem>
        ))}
      </ActionsMenuWrapper>
    </>
  )
}

PermissionTypeMenu.propTypes = {
  value: PropTypes.string.isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  mobileHeader: PropTypes.node
}

export default PermissionTypeMenu
