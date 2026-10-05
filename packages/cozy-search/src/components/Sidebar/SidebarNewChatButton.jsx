import cx from 'classnames'
import React from 'react'

import { Icon, Plus } from '@linagora/twake-icons'
import Button from 'cozy-ui/transpiled/react/Buttons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

export const SidebarNewChatButton = ({ isExpanded, onClick }) => {
  const { t } = useI18n()

  if (!isExpanded) {
    return (
      <div className={cx('u-pb-half', styles['sidebar-new-chat'])}>
        <IconButton
          size="medium"
          className="u-bg-primaryColor u-white u-bdrs-6"
          onClick={onClick}
          aria-label={t('assistant.sidebar.create_new')}
        >
          <Icon icon={Plus} aria-hidden="true" />
        </IconButton>
      </div>
    )
  }

  return (
    <div className={cx('u-pb-half', styles['sidebar-new-chat'])}>
      <Button
        className="u-w-100 u-bdrs-6"
        label={t('assistant.sidebar.create_new')}
        startIcon={<Icon icon={Plus} />}
        fullWidth
        variant="primary"
        onClick={onClick}
      />
    </div>
  )
}
