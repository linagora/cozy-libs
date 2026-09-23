import cx from 'classnames'
import React from 'react'

import { Icon, Comment } from '@linagora/twake-icons'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

const NotFoundConversation = () => {
  const { t } = useI18n()

  return (
    <div className="u-flex u-flex-column u-flex-items-center u-flex-justify-center u-h-100 u-w-100 u-ta-center">
      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-center u-w-4 u-h-4 u-bdrs-circle u-mb-half',
          styles['not-found-icon']
        )}
      >
        <Icon icon={Comment} color="var(--primaryColor)" size={32} />
      </div>
      <Typography variant="h4" className="u-mb-half">
        {t('assistant.search_conversation.not_found_title')}
      </Typography>
      <Typography
        variant="body1"
        color="textSecondary"
        className={styles['not-found-desc']}
      >
        {t('assistant.search_conversation.not_found_desc')}
      </Typography>
    </div>
  )
}

export default NotFoundConversation
