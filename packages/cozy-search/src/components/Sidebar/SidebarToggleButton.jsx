import React from 'react'

import { Icon, Menu } from '@linagora/twake-icons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useI18n } from 'twake-i18n'

export const SidebarToggleButton = ({ onClick }) => {
  const { t } = useI18n()

  return (
    <IconButton
      size="small"
      onClick={onClick}
      aria-label={t('assistant.sidebar.toggle_sidebar')}
    >
      <Icon icon={Menu} size={16} aria-hidden="true" />
    </IconButton>
  )
}
