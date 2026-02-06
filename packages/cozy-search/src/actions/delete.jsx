import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

const makeComponent = (label, icon) => {
  const Component = forwardRef((props, ref) => {
    return (
      <ActionsMenuItem className="u-error" {...props} ref={ref}>
        <ListItemIcon>
          <Icon className="u-error" icon={icon} />
        </ListItemIcon>
        <ListItemText primary={label} />
      </ActionsMenuItem>
    )
  })

  Component.displayName = 'Delete'

  return Component
}

export const remove = ({ t }) => {
  const icon = TrashIcon
  const label = t('assistant.sidebar.conversation.actions.delete')

  return {
    name: 'delete',
    icon,
    label,
    Component: makeComponent(label, icon),
    displayCondition: () => true,
    action: () => {}
  }
}
