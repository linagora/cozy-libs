import { Icon, Narrow } from '@linagora/twake-icons'
import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
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

  Component.displayName = 'makeSummaryShorter'

  return Component
}

export const makeSummaryShorter = ({ t, location, navigate }) => {
  const icon = Narrow
  const label = t('Viewer.panel.shorter')

  return {
    name: 'makeSummaryShorter',
    icon,
    label,
    Component: makeComponent(label, icon),
    action: () => {
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          showAIAssistant: true,
          type: 'makeSummaryShorter'
        }
      })
    }
  }
}
