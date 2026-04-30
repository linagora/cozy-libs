import PropTypes from 'prop-types'
import React from 'react'

import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { SharedDriveForm } from './SharedDriveForm'

export const SharedDriveModal = withLocales(({ onClose }) => {
  const { t } = useI18n()
  return (
    <FixedDialog
      open
      disableGutters
      onClose={onClose}
      title={t('SharedDrive.sharedDriveModal.title')}
      classes={{ paper: 'u-ov-visible' }}
      componentsProps={{
        dialogContent: { className: 'u-ov-visible' }
      }}
      content={<SharedDriveForm onSuccess={onClose} onCancel={onClose} />}
    />
  )
})

SharedDriveModal.propTypes = {
  onClose: PropTypes.func.isRequired
}
