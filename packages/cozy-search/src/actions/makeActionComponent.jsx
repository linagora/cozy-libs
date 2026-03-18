import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

const makeActionComponent = (label, icon, { className } = {}) => {
  const Component = forwardRef((props, ref) => {
    return (
      <ActionsMenuItem className={className} {...props} ref={ref}>
        <ListItemIcon>
          <Icon className={className} icon={icon} />
        </ListItemIcon>
        <ListItemText primary={label} />
      </ActionsMenuItem>
    )
  })

  Component.displayName = 'ActionComponent'

  return Component
}

export default makeActionComponent
