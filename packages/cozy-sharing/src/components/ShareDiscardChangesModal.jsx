import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { ConfirmDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useI18n } from 'twake-i18n'

const ShareDiscardChangesModal = ({ onCancel, onConfirm }) => {
  const { t } = useI18n()

  return (
    <ConfirmDialog
      open
      title={t('ShareDiscardChangesModal.title')}
      actions={
        <>
          <Button
            variant="secondary"
            label={t('ShareDiscardChangesModal.cancel')}
            className="u-fz-small"
            onClick={onCancel}
          />
          <Button
            variant="primary"
            label={t('ShareDiscardChangesModal.discard')}
            className="u-fz-small"
            onClick={onConfirm}
          />
        </>
      }
    />
  )
}

ShareDiscardChangesModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}

export { ShareDiscardChangesModal }
