import PropTypes from 'prop-types'
import React, { memo } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useSubmitWithLoader } from 'cozy-ui/transpiled/react/hooks/useSubmitWithLoader'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { default as DumbShareByEmail } from '../ShareByEmail'
import SharedDriveHeader from './SharedDriveHeader'
import { useSharedDrive } from './useSharedDrive'

const ShareByEmailSection = memo(function ShareByEmailSection({
  pendingRecipients,
  setPendingRecipients,
  selectedOption,
  autoFocus,
  setSelectedOption
}) {
  return (
    <DumbShareByEmail
      currentRecipients={[]}
      documentType="Files"
      pendingRecipients={pendingRecipients}
      onPendingRecipientsChange={setPendingRecipients}
      selectedOption={selectedOption}
      autoFocus={autoFocus}
      onSelectedOptionChange={setSelectedOption}
    />
  )
})

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
  } = useSharedDrive()
  const { onSubmit, isLoading } = useSubmitWithLoader()

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
          autoFocus
          onChange={handleSharedDriveNameChange}
        />
        <Typography variant="h6" className="u-mb-half">
          {t('Share.contacts.addUsers')}
        </Typography>
        <ShareByEmailSection
          pendingRecipients={pendingRecipients}
          setPendingRecipients={setPendingRecipients}
          selectedOption={selectedOption}
          autoFocus={false}
          setSelectedOption={setSelectedOption}
        />
      </div>
      <div className="u-flex u-ph-2 u-pv-1">
        <Button
          variant="text"
          label={t('SharedDrive.sharedDriveModal.cancel')}
          className="u-w-100 u-m-1"
          size="large"
          onClick={onCancel}
          disabled={isLoading}
        />
        <Button
          variant="primary"
          label={t('SharedDrive.sharedDriveModal.create')}
          className="u-w-100 u-m-1"
          size="large"
          onClick={() =>
            onSubmit({
              submit: onCreate,
              success: {
                action: onSuccess,
                message: t('SharedDrive.sharedDriveModal.successNotification')
              },
              error: {
                message: () =>
                  t('SharedDrive.sharedDriveModal.errorNotification')
              }
            })
          }
          busy={isLoading}
        />
      </div>
    </div>
  )
})

SharedDriveForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
}
