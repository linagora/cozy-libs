import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { DumbSharedDriveModal } from './DumbSharedDriveModal'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import { Contact } from '../../models'

export const SharedDriveEditModal = withLocales(
  ({
    document,
    sharing,
    recipients,
    onShare,
    onRevoke,
    onClose,
    autoOpenShareRestriction,
    showGenerateLinkButton
  }) => {
    const client = useClient()
    const { t } = useI18n()
    const { showAlert } = useAlert()
    const { renameSharedDrive } = useSharingContext()

    const createContact = contact => client.create(Contact.doctype, contact)
    const [name, setName] = useState(sharing?.description)

    const handleNameChange = event => {
      setName(event.target.value)
    }
    const onRename = async value => {
      try {
        await renameSharedDrive(document, value)
        showAlert({
          message: t('SharedDrive.sharedDriveModal.successNotificationUpdate'),
          severity: 'success'
        })
        onClose()
      } catch (_error) {
        showAlert({
          message: t('SharedDrive.sharedDriveModal.errorNotificationUpdate'),
          severity: 'error'
        })
      }
    }

    return (
      <DumbSharedDriveModal
        title={t('Files.share.title', { name: sharing?.description })}
        document={document}
        createContact={createContact}
        recipients={recipients}
        onRevoke={onRevoke}
        onClose={onClose}
        onShare={onShare}
        sharedDriveName={name}
        handleSharedDriveNameChange={handleNameChange}
        onRename={onRename}
        autoOpenShareRestriction={autoOpenShareRestriction}
        showGenerateLinkButton={showGenerateLinkButton}
      />
    )
  }
)

SharedDriveEditModal.propTypes = {
  document: PropTypes.object,
  sharing: PropTypes.object,
  recipients: PropTypes.array,
  onShare: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool
}
