import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlanetIcon from 'cozy-ui/transpiled/react/Icons/Planet'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

const CHIP_CLASSES = {
  label: 'u-p-0',
  icon: 'u-m-0'
}

const WebSearchChip = ({ websearchEnabled, onToggleWebsearch }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  return (
    <Chip
      aria-pressed={websearchEnabled}
      aria-label={t('assistant.websearch.label')}
      title={t('assistant.websearch.label')}
      icon={
        <Icon
          icon={PlanetIcon}
          size={16}
          style={{
            height: 16,
            width: 16,
            marginLeft: isMobile ? 0 : 8,
            marginRight: isMobile ? 0 : 6
          }}
          color={websearchEnabled ? undefined : 'var(--secondaryTextColor)'}
        />
      }
      label={isMobile ? '' : t('assistant.websearch.label')}
      clickable
      variant={websearchEnabled ? 'ghost' : 'default'}
      classes={isMobile ? CHIP_CLASSES : { label: 'u-pl-0 u-fz-tiny' }}
      className="u-mr-half"
      onClick={onToggleWebsearch}
    />
  )
}

export default WebSearchChip
