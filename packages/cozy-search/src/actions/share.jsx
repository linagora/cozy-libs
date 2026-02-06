import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ShareIcon from 'cozy-ui/transpiled/react/Icons/Share'
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

  Component.displayName = 'Share'

  return Component
}

export const share = ({ t }) => {
  const icon = ShareIcon
  const label = t('assistant.sidebar.conversation.actions.share')

  return {
    name: 'share',
    icon,
    label,
    Component: makeComponent(label, icon),
    displayCondition: () => true,
    action: () => { }
  }
}
