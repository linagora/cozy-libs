import { Icon, CloudPlusOutlined } from '@linagora/twake-icons'
import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import { openExternalLink } from '../helpers/sharings'
import { getActionsI18n } from '../hoc/withLocales'

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
  Component.displayName = 'AddToCozySharingLink'

  return Component
}

export const addToCozySharingLink = ({
  isSharingShortcutCreated,
  openSharingLinkDisplayed = true,
  isShortLabel = false,
  addSharingLink
}) => {
  const { t } = getActionsI18n()
  const label = t('Share.banner.add_to_mine', {
    smart_count: isShortLabel ? 1 : 2
  })
  const icon = CloudPlusOutlined

  return {
    name: 'addToCozySharingLink',
    label,
    icon,
    displayCondition: () =>
      openSharingLinkDisplayed && !isSharingShortcutCreated,
    action: () => {
      openExternalLink(addSharingLink)
    },
    Component: makeComponent(label, icon)
  }
}
