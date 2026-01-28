import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ExpandIcon from 'cozy-ui/transpiled/react/Icons/Expand'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

const makeComponent = (label, icon) => {
  const Component = forwardRef((props, ref) => {
    return (
      <ActionsMenuItem {...props} ref={ref}>
        <ListItemIcon>
          <Icon icon={icon} />
        </ListItemIcon>
        <ListItemText primary={label} />
      </ActionsMenuItem>
    )
  })

  Component.displayName = 'expand'

  return Component
}

export const expand = ({ t, makeLonger, isExpanded }) => {
  const icon = ExpandIcon
  const label = t('Viewer.panel.expand')

  return {
    name: 'expand',
    icon,
    label,
    Component: makeComponent(label, icon),
    displayCondition: () => !isExpanded,
    action: () => makeLonger()
  }
}
