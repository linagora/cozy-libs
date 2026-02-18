import PropTypes from 'prop-types'
import React from 'react'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import DumbBatchSharedFolderModal from '../SharedFolder/DumbBatchSharedFolderModal'

export const DumbFederatedFolderModal = withLocales(
  ({
    title,
    document,
    createContact,
    recipients,
    readOnlyRecipients,
    currentRecipients,
    onRevoke,
    onSetType,
    onSend,
    onClose,
    onShare,
    sharingLink
  }) => {
    const { t } = useI18n()
    return (
      <DumbBatchSharedFolderModal
        title={title}
        document={document}
        createContact={createContact}
        recipients={recipients}
        readOnlyRecipients={readOnlyRecipients}
        currentRecipients={currentRecipients}
        onRevoke={onRevoke}
        onSetType={onSetType}
        onSend={onSend}
        onClose={onClose}
        onShare={onShare}
        sharingLink={sharingLink}
        showNameField={false}
        addPeopleLabel={t('FederatedFolder.addPeople')}
        addButtonLabel={t('FederatedFolder.add')}
        shareLabel={t('FederatedFolder.share')}
      />
    )
  }
)

DumbFederatedFolderModal.propTypes = {
  title: PropTypes.string,
  document: PropTypes.object,
  createContact: PropTypes.func.isRequired,
  recipients: PropTypes.array,
  readOnlyRecipients: PropTypes.array,
  currentRecipients: PropTypes.array,
  onRevoke: PropTypes.func.isRequired,
  onSetType: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  sharingLink: PropTypes.string
}

export default DumbFederatedFolderModal
