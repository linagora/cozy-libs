import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import SharedDriveHeader from './SharedDriveHeader'
import { getOrCreateFromArray } from '../../helpers/contacts'
import withLocales from '../../hoc/withLocales'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { useSharingContext } from '../../hooks/useSharingContext'
import { default as DumbShareByEmail } from '../ShareByEmail'
import WhoHasAccess from '../WhoHasAccess'

export const EditSharedDriveModal = withLocales(({ onClose, document }) => {
  const client = useClient()
  const { t } = useI18n()
  const { share, getRecipients, revoke } = useSharingContext()
  const { showAlert } = useAlert()
  const {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  } = usePendingRecipients()

  const [driveName, setDriveName] = useState(document.name)
  const [isSaving, setIsSaving] = useState(false)

  const onSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      // We add contacts
      const contacts = await getOrCreateFromArray(
        client,
        pendingRecipients,
        contact => client.create('io.cozy.contacts', contact)
      )
      const readWriteRecipients = selectedOption === 'readOnly' ? [] : contacts
      const readOnlyRecipients = selectedOption === 'readOnly' ? contacts : []

      await share({
        document: document,
        recipients: readWriteRecipients,
        readOnlyRecipients,
        sharedDrive: true,
        openSharing: false
      })

      // We rename the shared drive
      if (document?.name !== driveName) {
        await client.collection('io.cozy.files').update({
          ...document,
          name: driveName,
          _rev: document._rev || document.meta.rev
        })
      }

      showAlert({
        message: t('SharedDrive.editSharedDriveModal.successNotification'),
        severity: 'success',
        variant: 'filled'
      })

      onClose()
    } catch (_err) {
      showAlert({
        message: t('SharedDrive.editSharedDriveModal.errorNotification'),
        severity: 'error',
        variant: 'filled'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const existingRecipients = document ? getRecipients(document._id) : []

  return (
    <FixedDialog
      open
      disableGutters
      onClose={onClose}
      classes={{ paper: 'u-ov-visible' }}
      componentsProps={{
        dialogContent: { className: 'u-ov-visible' }
      }}
      content={
        <div>
          <div className="u-ph-2 u-pt-2">
            <SharedDriveHeader
              title={t('SharedDrive.editSharedDriveModal.title')}
            />
            <TextField
              required
              label={t('SharedDrive.sharedDriveModal.nameLabel')}
              variant="outlined"
              size="small"
              className="u-w-100 u-mt-1-half u-mb-1-half"
              value={driveName}
              onChange={event => setDriveName(event.target.value)}
            />
            <Typography variant="h6" className="u-mb-half">
              {t('Share.contacts.addUsers')}
            </Typography>
            <DumbShareByEmail
              documentType="Files"
              currentRecipients={existingRecipients}
              pendingRecipients={pendingRecipients}
              onPendingRecipientsChange={setPendingRecipients}
              selectedOption={selectedOption}
              onSelectedOptionChange={setSelectedOption}
            />
          </div>
          <WhoHasAccess
            isOwner
            isSharedDrive
            showOwner={false}
            recipients={existingRecipients}
            document={document}
            documentType="Files"
            className="u-w-100"
            onRevoke={revoke}
          />
          <div className="u-flex u-ph-2 u-pv-1">
            <Button
              variant="text"
              label={t('SharedDrive.sharedDriveModal.cancel')}
              className="u-w-100 u-m-1"
              size="large"
              onClick={onClose}
            />
            <Button
              variant="primary"
              label={t('SharedDrive.sharedDriveModal.save')}
              className="u-w-100 u-m-1"
              size="large"
              disabled={isSaving}
              onClick={onSave}
            />
          </div>
        </div>
      }
    />
  )
})

EditSharedDriveModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  document: PropTypes.object.isRequired,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool
}

export default EditSharedDriveModal
