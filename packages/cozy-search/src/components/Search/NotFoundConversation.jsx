import { Icon, Assistant } from '@linagora/twake-icons'
import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

const NotFoundConversation = () => {
  const { t } = useI18n()

  return (
    <div className="u-flex u-flex-column u-flex-items-center u-flex-justify-center u-h-100 u-w-100 u-ta-center">
      <div className="u-flex u-flex-items-center u-flex-justify-center u-w-3 u-h-3 u-bdrs-circle u-mb-1">
        <Icon icon={Assistant} color="textSecondary" size="24" />
      </div>
      <Typography variant="h4" className="u-mb-1">
        {t('assistant.search_conversation.not_found_title')}
      </Typography>
      <Typography variant="body1" color="textSecondary" className="u-maw-20">
        {t('assistant.search_conversation.not_found_desc')}
      </Typography>
    </div>
  )
}

export default NotFoundConversation
