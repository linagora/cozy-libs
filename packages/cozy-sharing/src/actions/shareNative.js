import { Icon, Reply } from '@linagora/twake-icons'
import React, { forwardRef } from 'react'

import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

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
  Component.displayName = 'ShareNative'

  return Component
}

export const shareNative = ({
  shareFilesNative,
  isNativeFileSharingAvailable
}) => {
  const { t } = getActionsI18n()

  const label = t('Share.send')
  const icon = Reply

  return {
    name: 'shareNative',
    label,
    icon,
    displayCondition: selectedFiles => {
      return (
        isNativeFileSharingAvailable &&
        selectedFiles.every(selectedFile => selectedFile.type === 'file')
      )
    },
    action: data => {
      const idsToShare = data.map(d => d._id)
      shareFilesNative(idsToShare)
    },
    Component: makeComponent(label, icon)
  }
}
