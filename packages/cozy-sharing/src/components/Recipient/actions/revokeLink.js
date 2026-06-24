import { Icon, Trash } from '@linagora/twake-icons'
import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

const revokeLink = ({ t, handleRevocation }) => {
  const title = t('Share.permissionLink.deactivate')

  return {
    name: 'revokeLink',
    label: title,
    icon: Trash,
    action: handleRevocation,
    Component: forwardRef(function RevokeLinkItem(props, ref) {
      return (
        <ActionsMenuItem {...props} ref={ref}>
          <ListItemIcon>
            <Icon icon={Trash} color="var(--errorColor)" />
          </ListItemIcon>
          <ListItemText
            primary={<Typography color="error">{title}</Typography>}
          />
        </ActionsMenuItem>
      )
    })
  }
}

export { revokeLink }
