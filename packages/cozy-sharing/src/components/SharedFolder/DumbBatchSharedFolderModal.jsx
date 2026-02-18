import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'

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
    showNameField = false,
    sharingLink,
    nameLabel,
    addPeopleLabel,
    addButtonLabel,
    cancelLabel,
    createLabel,
    shareLabel,
    saveLabel,
    sharingDesc
  }) => {
    const hasRecipients = Boolean(recipients?.length)

    // Determine action buttons based on modal mode
    const actionButtons = (() => {
      if (showNameField && onCreate) {
        return (
          <>
            <Button variant="secondary" label={cancelLabel} onClick={onClose} />
            <Button variant="primary" label={createLabel} onClick={onCreate} />
          </>
        )
      }

      if (!showNameField) {
        return (
          <>
            <ShareByLink
              link={sharingLink}
              document={document}
              documentType="Files"
            />
            <Button
              variant="primary"
              label={shareLabel}
              disabled={!hasRecipients || !onSend}
              onClick={onSend}
            />
          </>
        )
      }

      if (onRename) {
        return (
          <Button
            variant="primary"
            label={saveLabel}
            onClick={() => onRename(folderName)}
          />
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
                {addPeopleLabel}
              </Typography>
              <DumbShareByEmail
                createContact={createContact}
                currentRecipients={currentRecipients}
                document={document}
                documentType="Files"
                sharedDrive
                sharingDesc={sharingDesc}
                onShare={params => {
                  onShare(params)
                }}
                submitLabel={addButtonLabel}
                showNotifications={false}
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
              onSetType={onSetType}
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
  nameLabel: PropTypes.string,
  addPeopleLabel: PropTypes.string,
  addButtonLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  createLabel: PropTypes.string,
  shareLabel: PropTypes.string,
  saveLabel: PropTypes.string,
  sharingDesc: PropTypes.string.isRequired
}

export default DumbBatchSharedFolderModal
