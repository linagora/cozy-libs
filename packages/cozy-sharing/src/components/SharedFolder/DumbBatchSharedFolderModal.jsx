import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import TextField from 'cozy-ui/transpiled/react/TextField'
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
    folderName,
    handleFolderNameChange,
    recipients,
    currentRecipients,
    onRevoke,
    onSend,
    onClose,
    showNameField = false,
    sharingLink,
    nameLabel,
    shareLabel,
    showShareByEmail = true,
    autoOpenShareRestriction,
    showGenerateLinkButton,
    pendingRecipients,
    onPendingRecipientsChange,
    selectedOption,
    onSelectedOptionChange
  }) => {
    const { t } = useI18n()
    const actionButtons = (() => {
      if (!showShareByEmail) {
        return (
          <ShareByLink
            link={sharingLink}
            document={document}
            documentType="Files"
            showGenerateLinkButton={showGenerateLinkButton}
            autoOpenShareRestriction={autoOpenShareRestriction}
          />
        )
      }

      if (!showNameField) {
        return (
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
        )
      }

      return null
    })()

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
              {showNameField && handleFolderNameChange && (
                <TextField
                  required
                  label={nameLabel}
                  variant="outlined"
                  size="small"
                  className="u-w-100 u-mt-1-half"
                  value={folderName ?? ''}
                  onChange={handleFolderNameChange}
                />
              )}
              <Typography variant="h6" className="u-mt-1-half u-mb-half">
                {t('Share.contacts.addUsers')}
              </Typography>
              {showShareByEmail && (
                <DumbShareByEmail
                  currentRecipients={currentRecipients}
                  document={document}
                  documentType="Files"
                  pendingRecipients={pendingRecipients}
                  onPendingRecipientsChange={onPendingRecipientsChange}
                  selectedOption={selectedOption}
                  onSelectedOptionChange={onSelectedOptionChange}
                />
              )}
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
        actions={actionButtons}
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
