import { Icon, TwakeWorkplace } from '@linagora/twake-icons'
import cx from 'classnames'
import React from 'react'

import { useInstanceInfo } from 'cozy-client'
import { buildPremiumLink } from 'cozy-client/dist/models/instance'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { useI18n, useExtendI18n } from 'twake-i18n'

import { locales } from './locales'

const StorageButton = ({ className }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const instanceInfo = useInstanceInfo()

  return (
    <Button
      className={cx('u-bdrs-4', className)}
      variant="secondary"
      label={t('Storage.increase')}
      startIcon={<Icon icon={TwakeWorkplace} size={22} />}
      size="small"
      height="auto"
      fullWidth
      component="a"
      target="_blank"
      href={buildPremiumLink(instanceInfo)}
    />
  )
}

export default StorageButton
