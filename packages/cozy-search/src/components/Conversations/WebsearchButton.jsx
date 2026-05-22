import React from 'react'

import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlanetIcon from 'cozy-ui/transpiled/react/Icons/Planet'
import { useI18n } from 'twake-i18n'

const WebsearchButton = ({ websearchEnabled, onToggleWebsearch }) => {
  const { t } = useI18n()

  if (!flag('cozy.assistant.websearch.enabled')) {
    return null
  }

  return (
    <Button
      size="small"
      variant={websearchEnabled ? 'primary' : 'text'}
      className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle u-flex-shrink-0 u-mr-half"
      classes={{ label: 'u-flex u-w-auto' }}
      style={
        websearchEnabled
          ? undefined
          : { boxShadow: 'inset 0 0 0 1px var(--secondaryTextColor)' }
      }
      aria-pressed={websearchEnabled}
      aria-label={t('assistant.websearch.label')}
      title={t('assistant.websearch.label')}
      label={
        <Icon
          icon={PlanetIcon}
          size={12}
          color={websearchEnabled ? undefined : 'var(--secondaryTextColor)'}
        />
      }
      onClick={onToggleWebsearch}
    />
  )
}

export default WebsearchButton
