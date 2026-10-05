import React from 'react'

import { Icon, CrossSmall, Magnifier } from '@linagora/twake-icons'
import flag from 'cozy-flags'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import { SidebarToggleButton } from './SidebarToggleButton'

export const SidebarHeader = ({
  isExpanded,
  onToggle,
  onToggleSearch,
  onClose
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  if (!isExpanded) {
    return (
      <div className="u-flex u-flex-items-center u-flex-justify-center u-ph-1 u-pv-1">
        <SidebarToggleButton onClick={onToggle} />
      </div>
    )
  }

  return (
    <div className="u-flex u-flex-items-center u-flex-justify-between u-ph-1-half u-pv-1">
      <SidebarToggleButton onClick={onToggle} />
      <div>
        {flag('cozy.assistant.search-conversation.enabled') && (
          <IconButton
            size="small"
            onClick={onToggleSearch}
            aria-label={t('assistant.sidebar.toggle_search')}
          >
            <Icon icon={Magnifier} size={16} aria-hidden="true" />
          </IconButton>
        )}
        {isMobile && (
          <IconButton
            size="small"
            onClick={onClose}
            aria-label={t('assistant.sidebar.close_sidebar')}
          >
            <Icon icon={CrossSmall} size={16} aria-hidden="true" />
          </IconButton>
        )}
      </div>
    </div>
  )
}
