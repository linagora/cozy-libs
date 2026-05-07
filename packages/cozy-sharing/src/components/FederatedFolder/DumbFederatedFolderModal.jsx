import PropTypes from 'prop-types'
import React from 'react'

import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import { DumbBatchSharedFolderModal } from '../SharedFolder/DumbBatchSharedFolderModal'

export const DumbFederatedFolderModal = withLocales(
  ({
    title,
    document,
    recipients,
    currentRecipients,
    onRevoke,
    onSend,
    onClose,
    sharingLink,
    showShareByEmail,
    autoOpenShareRestriction,
    showGenerateLinkButton,
    pendingRecipients,
    onPendingRecipientsChange,
    selectedOption,
    onSelectedOptionChange
  }) => {
    const { t } = useI18n()
    return (
      <DumbBatchSharedFolderModal
        title={title}
        document={document}
        recipients={recipients}
        currentRecipients={currentRecipients}
        onRevoke={onRevoke}
        onSend={onSend}
        onClose={onClose}
        sharingLink={sharingLink}
        showNameField={false}
        addPeopleLabel={t('FederatedFolder.addPeople')}
        shareLabel={t('FederatedFolder.share')}
        showShareByEmail={showShareByEmail}
        autoOpenShareRestriction={autoOpenShareRestriction}
        showGenerateLinkButton={showGenerateLinkButton}
        pendingRecipients={pendingRecipients}
        onPendingRecipientsChange={onPendingRecipientsChange}
        selectedOption={selectedOption}
        onSelectedOptionChange={onSelectedOptionChange}
      />
    )
  }
)

DumbFederatedFolderModal.propTypes = {
  title: PropTypes.string,
  document: PropTypes.object,
  recipients: PropTypes.array,
  currentRecipients: PropTypes.array,
  onRevoke: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  sharingLink: PropTypes.string,
  showShareByEmail: PropTypes.bool,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool,
  pendingRecipients: PropTypes.array.isRequired,
  onPendingRecipientsChange: PropTypes.func.isRequired,
  selectedOption: PropTypes.oneOf(['readWrite', 'readOnly']).isRequired,
  onSelectedOptionChange: PropTypes.func.isRequired
}

export default DumbFederatedFolderModal
