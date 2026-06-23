import { Icon, Gear } from '@linagora/twake-icons'
import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useI18n } from 'twake-i18n'

const connectAction = ({ isDisconnected, konnectorRoot, navigate }) => ({
  name: 'connectAction',
  action: () => {
    navigate(`${konnectorRoot}/new`)
  },
  displayCondition: () => isDisconnected,
  Component: forwardRef(function ConnectAction(props, ref) {
    const { t } = useI18n()
    return (
      <ActionsMenuItem {...props} ref={ref}>
        <ListItemIcon>
          <Icon icon={Gear} />
        </ListItemIcon>
        <ListItemText primary={t('card.launchTrigger.connect')} />
      </ActionsMenuItem>
    )
  })
})

export { connectAction }
