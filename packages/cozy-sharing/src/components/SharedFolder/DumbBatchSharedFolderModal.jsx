import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import withLocales from '../../hoc/withLocales'
import AntivirusAlert from '../AntivirusAlert'
import { default as DumbShareByEmail } from '../ShareByEmail'
import ShareByLink from '../ShareByLink'
import WhoHasAccess from '../WhoHasAccess'

export const DumbBatchSharedFolderModal = withLocales(
  ({
    title,
    document,
    recipients,
    currentRecipients,
    onRevoke,
    onSend,
    onClose,
    sharingLink,
    shareLabel,
    autoOpenShareRestriction,
    showGenerateLinkButton,
    pendingRecipients,
    onPendingRecipientsChange,
    selectedOption,
    onSelectedOptionChange
  }) => {
    const { t } = useI18n()

    return (
      <FixedDialog
        open
        disableGutters
        onClose={onClose}
        title={title}
        classes={{ paper: 'u-ov-visible' }}
        componentsProps={{
          dialogContent: { className: 'u-ov-visible' }
        }}
        content={
          <div>
            <div className="u-ph-2">
              <AntivirusAlert document={document} />
              <Typography variant="h6" className="u-mt-1-half u-mb-half">
                {t('Share.contacts.addUsers')}
              </Typography>
              <DumbShareByEmail
                currentRecipients={currentRecipients}
                document={document}
                documentType="Files"
                pendingRecipients={pendingRecipients}
                onPendingRecipientsChange={onPendingRecipientsChange}
                selectedOption={selectedOption}
                onSelectedOptionChange={onSelectedOptionChange}
              />
            </div>
            <WhoHasAccess
              isOwner
              isSharedDrive
              recipients={recipients}
              document={document}
              documentType="Files"
              className="u-w-100"
              onRevoke={onRevoke}
              link={sharingLink}
            />
          </div>
        }
        actions={
          <>
            <ShareByLink
              link={sharingLink}
              document={document}
              documentType="Files"
              showGenerateLinkButton={showGenerateLinkButton}
              autoOpenShareRestriction={autoOpenShareRestriction}
            />
            <Button
              variant="primary"
              label={shareLabel}
              disabled={!onSend}
              onClick={onSend}
            />
          </>
        }
      />
    )
  }
)

DumbBatchSharedFolderModal.propTypes = {
  title: PropTypes.string,
  document: PropTypes.object,
  folderName: PropTypes.string,
  handleFolderNameChange: PropTypes.func,
  recipients: PropTypes.array,
  currentRecipients: PropTypes.array,
  onRevoke: PropTypes.func.isRequired,
  onCreate: PropTypes.func,
  onSend: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  onRename: PropTypes.func,
  showNameField: PropTypes.bool,
  sharingLink: PropTypes.string,
  nameLabel: PropTypes.string,
  addPeopleLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  createLabel: PropTypes.string,
  shareLabel: PropTypes.string,
  saveLabel: PropTypes.string,
  showShareByEmail: PropTypes.bool,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool,
  pendingRecipients: PropTypes.array,
  onPendingRecipientsChange: PropTypes.func,
  selectedOption: PropTypes.oneOf(['readWrite', 'readOnly']),
  onSelectedOptionChange: PropTypes.func
}
