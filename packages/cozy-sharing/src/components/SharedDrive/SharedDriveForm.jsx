import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { default as DumbShareByEmail } from '../ShareByEmail'
import WhoHasAccess from '../WhoHasAccess'
import { useSharedDrive } from './useSharedDrive'

export const SharedDriveForm = withLocales(({ onSuccess, onCancel }) => {
  const { t } = useI18n()
  const {
    sharedDriveName,
    recipients,
    handleSharedDriveNameChange,
    onShare,
    onCreate,
    onSetType,
    onRevoke,
    createContact
  } = useSharedDrive({ onSuccess })

  return (
    <div>
      <div className="u-ph-2">
        <TextField
          required
          label={t('SharedDrive.sharedDriveModal.nameLabel')}
          variant="outlined"
          size="small"
          className="u-w-100 u-mt-1-half"
          value={sharedDriveName}
          onChange={handleSharedDriveNameChange}
        />
        <Typography variant="h6" className="u-mt-1-half u-mb-half">
          {t('SharedDrive.sharedDriveModal.addPeople')}
        </Typography>
        <DumbShareByEmail
          createContact={createContact}
          currentRecipients={recipients}
          documentType="Files"
          sharedDrive
          onShare={onShare}
          submitLabel={t('SharedDrive.sharedDriveModal.add')}
          showNotifications={false}
          sharingDesc=""
        />
      </div>
      <WhoHasAccess
        isOwner
        isSharedDrive
        recipients={recipients}
        documentType="Files"
        className="u-w-100"
        onRevoke={onRevoke}
        onSetType={onSetType}
      />
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
