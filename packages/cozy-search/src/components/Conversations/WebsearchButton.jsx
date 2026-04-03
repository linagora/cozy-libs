import React from 'react'

import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import GlobeIcon from 'cozy-ui/transpiled/react/Icons/Globe'
import { useI18n } from 'twake-i18n'

const WebsearchButton = ({ websearchEnabled, onToggleWebsearch }) => {
  const { t } = useI18n()

  if (!flag('cozy.assistant.websearch.enabled')) {
    return null
  }

  return (
    <IconButton
      className="u-p-0 u-mr-half"
      aria-pressed={websearchEnabled}
      aria-label={t('assistant.websearch.label')}
      title={t('assistant.websearch.label')}
      onClick={onToggleWebsearch}
    >
      <Button
        size="small"
        component="div"
        className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
        classes={{ label: 'u-flex u-w-auto' }}
        disabled={!websearchEnabled}
        label={<Icon icon={GlobeIcon} size={12} />}
      />
    </IconButton>
  )
}

export default WebsearchButton
