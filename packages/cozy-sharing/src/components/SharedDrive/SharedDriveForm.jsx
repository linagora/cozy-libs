import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { default as DumbShareByEmail } from '../ShareByEmail'
import SharedDriveHeader from './SharedDriveHeader'
import { useSharedDrive } from './useSharedDrive'

export const SharedDriveForm = withLocales(({ onSuccess, onCancel }) => {
  const { t } = useI18n()
  const {
    sharedDriveName,
    handleSharedDriveNameChange,
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption,
    onCreate
  } = useSharedDrive({ onSuccess })

  return (
    <div>
      <div className="u-ph-2">
        <SharedDriveHeader title={t('SharedDrive.sharedDriveModal.title')} />
        <TextField
          required
          label={t('SharedDrive.sharedDriveModal.nameLabel')}
          variant="outlined"
          size="small"
          className="u-w-100 u-mt-1-half u-mb-1-half"
          value={sharedDriveName}
          onChange={handleSharedDriveNameChange}
        />
        <Typography variant="h6" className="u-mb-half">
          {t('Share.contacts.addUsers')}
        </Typography>
        <DumbShareByEmail
          currentRecipients={[]}
          documentType="Files"
          pendingRecipients={pendingRecipients}
          onPendingRecipientsChange={setPendingRecipients}
          selectedOption={selectedOption}
          onSelectedOptionChange={setSelectedOption}
        />
      </div>
      <div className="u-flex u-ph-2 u-pv-1">
        <Button
          variant="text"
          label={t('SharedDrive.sharedDriveModal.cancel')}
          className="u-w-100 u-m-1"
          size="large"
          onClick={onCancel}
        />
        <Button
          variant="primary"
          label={t('SharedDrive.sharedDriveModal.create')}
          className="u-w-100 u-m-1"
          size="large"
          onClick={onCreate}
        />
      </div>
    </div>
  )
})

SharedDriveForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}
