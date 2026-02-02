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

  Component.displayName = 'makeSummaryLonger'

  return Component
}

export const makeSummaryLonger = ({ t, navigate, location }) => {
  const icon = ExpandIcon
  const label = t('Viewer.panel.expand')

  return {
    name: 'makeSummaryLonger',
    icon,
    label,
    Component: makeComponent(label, icon),
    action: () => {
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          showAIAssistant: true,
          type: 'makeSummaryLonger'
        }
      })
    }
  }
}
