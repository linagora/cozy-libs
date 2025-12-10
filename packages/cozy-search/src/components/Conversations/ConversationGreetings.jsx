import React from 'react'
import { useI18n } from 'twake-i18n'

import Typography from 'cozy-ui/transpiled/react/Typography'

const ConversationGreetings = () => {
  const { t } = useI18n()
  return (
    <div className="u-mb-2">
      <Typography variant="h3" align="center">
        {t('assistant.search.greetings')}
      </Typography>
    </div>
  )
}

export default ConversationGreetings
