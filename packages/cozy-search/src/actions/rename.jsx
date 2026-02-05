import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import RenameIcon from 'cozy-ui/transpiled/react/Icons/Rename'
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

  Component.displayName = 'Rename'

  return Component
}

export const rename = ({ t }) => {
  const icon = RenameIcon
  const label = t('assistant.sidebar.conversation.actions.rename')

  return {
    name: 'rename',
    icon,
    label,
    Component: makeComponent(label, icon),
    displayCondition: () => true,
    action: () => { }
  }
}
