import { Icon, Planet } from '@linagora/twake-icons'
import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

const CHIP_CLASSES = {
  label: 'u-p-0',
  icon: 'u-m-0'
}

const WebSearchChip = ({ websearchEnabled, onToggleWebsearch }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  // Pointer activation leaves the DOM focus on the chip, and the `:focus`
  // background is darker than the plain ghost one: the toggled chip then looks
  // different from the sibling source chips (which are not clickable) until
  // something else takes the focus. Drop it for pointer activation only
  // (`detail > 0`), so keyboard users keep their focus ring.
  const handleClick = event => {
    if (event.detail > 0) {
      event.currentTarget.blur()
    }
    onToggleWebsearch(event)
  }

  return (
    <Chip
      aria-pressed={websearchEnabled}
      aria-label={t('assistant.websearch.label')}
      title={t('assistant.websearch.label')}
      icon={
        <Icon
          icon={Planet}
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
      onClick={handleClick}
    />
  )
}

export default WebSearchChip
