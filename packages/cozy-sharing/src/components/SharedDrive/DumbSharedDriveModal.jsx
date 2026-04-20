import PropTypes from 'prop-types'
import React from 'react'

import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { DumbBatchSharedFolderModal } from '../SharedFolder/DumbBatchSharedFolderModal'

export const DumbSharedDriveModal = withLocales(
  ({
    title,
    document,
    sharedDriveName,
    handleSharedDriveNameChange,
    createContact,
    recipients,
    currentRecipients,
    onRevoke,
    onSetType,
    onCreate,
    onSend,
    onClose,
    onShare,
    onRename,
    showNameField = true,
    sharingLink,
    autoOpenShareRestriction,
    showGenerateLinkButton
  }) => {
    const { t } = useI18n()
    return (
      <DumbBatchSharedFolderModal
        title={title}
        document={document}
        folderName={sharedDriveName}
        handleFolderNameChange={handleSharedDriveNameChange}
        createContact={createContact}
        recipients={recipients}
        currentRecipients={currentRecipients}
        onRevoke={onRevoke}
        onSetType={onSetType}
        onCreate={onCreate}
        onSend={onSend}
        onClose={onClose}
        onShare={onShare}
        onRename={onRename}
        showNameField={showNameField}
        sharingLink={sharingLink}
        nameLabel={t('SharedDrive.sharedDriveModal.nameLabel')}
        addPeopleLabel={t('SharedDrive.sharedDriveModal.addPeople')}
        addButtonLabel={t('SharedDrive.sharedDriveModal.add')}
        cancelLabel={t('SharedDrive.sharedDriveModal.cancel')}
        createLabel={t('SharedDrive.sharedDriveModal.create')}
        shareLabel={t('FederatedFolder.share')}
        saveLabel={t('SharedDrive.sharedDriveModal.save')}
        autoOpenShareRestriction={autoOpenShareRestriction}
        showGenerateLinkButton={showGenerateLinkButton}
      />
    )
  }
)

DumbSharedDriveModal.propTypes = {
  title: PropTypes.string,
  document: PropTypes.object,
  sharedDriveName: PropTypes.string,
  handleSharedDriveNameChange: PropTypes.func,
  createContact: PropTypes.func.isRequired,
  recipients: PropTypes.array,
  currentRecipients: PropTypes.array,
  onRevoke: PropTypes.func.isRequired,
  onSetType: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
  onSend: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  showNameField: PropTypes.bool,
  sharingLink: PropTypes.string,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool
}

export default DumbSharedDriveModal
