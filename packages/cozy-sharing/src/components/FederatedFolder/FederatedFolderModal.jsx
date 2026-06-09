import PropTypes from 'prop-types'
import React, { useCallback, useState } from 'react'

import { useClient } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import ConfirmDialogProvider, {
  useConfirmDialog
} from 'cozy-ui/transpiled/react/providers/ConfirmDialog'
import { useI18n } from 'twake-i18n'

import { getOrCreateFromArray } from '../../helpers/contacts'
import withLocales from '../../hoc/withLocales'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { useSharingContext } from '../../hooks/useSharingContext'
import styles from '../../styles/share.styl'
import AntivirusAlert from '../AntivirusAlert'
import { default as DumbShareByEmail } from '../ShareByEmail'
import ShareByLink from '../ShareByLink'
import WhoHasAccess from '../WhoHasAccess'

const FederatedFolderModalContent = ({
  onClose,
  document: existingDocument,
  autoOpenShareRestriction,
  showGenerateLinkButton
}) => {
  const client = useClient()
  const { t } = useI18n()
  const {
    share,
    getSharingLink,
    getFederatedShareLink,
    getRecipients,
    hasSharedChild,
    hasSharedParent,
    revoke
  } = useSharingContext()
  const { showAlert } = useAlert()
  const { showConfirmDialog, closeConfirmDialog } = useConfirmDialog()

  const {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  } = usePendingRecipients()

  // share from CozyProvider is wired to callbacks and realtime that
  // makes existingDocument and existingRecipients reactive to changes.
  // But we want it to be reactive only when we revoke a member. When we add member
  // we close the popup and we do not want to see briefly the new contacts added
  // in members before the modal closes. That's why when clicking on "Share"
  // we do not use the reactive existingDocument and existingRecipients.
  const [isSending, setIsSending] = useState(false)
  const [frozenDoc, setFrozenDoc] = useState(null)
  const [frozenRecipients, setFrozenRecipients] = useState(null)

  const handleCloseRequest = useCallback(() => {
    if (pendingRecipients.length === 0) {
      onClose()
      return
    }

    showConfirmDialog({
      title: t('ShareDiscardChangesModal.title'),
      actions: (
        <>
          <Button
            variant="secondary"
            label={t('ShareDiscardChangesModal.cancel')}
            className="u-fz-small"
            onClick={closeConfirmDialog}
          />
          <Button
            variant="primary"
            label={t('ShareDiscardChangesModal.discard')}
            className="u-fz-small"
            onClick={() => {
              closeConfirmDialog()
              onClose()
            }}
          />
        </>
      )
    })
  }, [
    closeConfirmDialog,
    onClose,
    pendingRecipients.length,
    showConfirmDialog,
    t
  ])

  const folderName = existingDocument?.name || ''
  const documentPath = existingDocument?.path
  const sharedDriveSharing = existingDocument?.driveId
    ? getSharingById(existingDocument.driveId)
    : null
  const sharedDriveRootIds =
    sharedDriveSharing?.attributes?.rules?.reduce(
      (ids, rule) => ids.concat(rule.values || []),
      []
    ) || []
  const isSharedDriveRoot = Boolean(
    existingDocument?.driveId &&
    sharedDriveRootIds.some(
      id => id === existingDocument?._id || id === existingDocument?.id
    )
  )
  const isInsideSharedDrive = Boolean(
    existingDocument?.driveId && !isSharedDriveRoot
  )
  const hasSharedParentByPath = Boolean(
    documentPath && hasSharedParent(documentPath)
  )
  const hasParentRestriction = isInsideSharedDrive || hasSharedParentByPath
  const hasChildRestriction = Boolean(
    documentPath && hasSharedChild(documentPath)
  )
  const canShareByEmail = !hasParentRestriction && !hasChildRestriction

  const onSend = async () => {
    if (isSending || pendingRecipients.length === 0) {
      onClose()
      return
    }

    setIsSending(true)
    setFrozenDoc(existingDocument)
    setFrozenRecipients(existingRecipients)

    try {
      const contacts = await getOrCreateFromArray(
        client,
        pendingRecipients,
        contact => client.create('io.cozy.contacts', contact)
      )
      const readWriteRecipients = selectedOption === 'readOnly' ? [] : contacts
      const readOnlyRecipients = selectedOption === 'readOnly' ? contacts : []

      await share({
        description: folderName,
        document: existingDocument,
        recipients: readWriteRecipients,
        readOnlyRecipients,
        sharedDrive: true,
        openSharing: false
      })

      showAlert({
        message: t('FederatedFolder.successNotification'),
        severity: 'success',
        variant: 'filled'
      })

      onClose()
    } catch (_err) {
      showAlert({
        message: t('FederatedFolder.errorNotification'),
        severity: 'error',
        variant: 'filled'
      })
    } finally {
      setIsSending(false)
    }
  }

  const existingRecipients = existingDocument
    ? getRecipients(existingDocument._id)
    : []
  const displayedLink = existingDocument?.driveId
    ? getFederatedShareLink(existingDocument)
    : getSharingLink(existingDocument?._id)

  const modalTitle = t('FederatedFolder.shareTitle', { name: folderName })

  return (
    <FixedDialog
      open
      disableGutters
      onClose={handleCloseRequest}
      title={modalTitle}
      classes={{ paper: 'u-ov-visible' }}
      componentsProps={{
        dialogContent: { className: 'u-ov-visible' }
      }}
      content={
        <div>
          <div className="u-ph-2">
            <AntivirusAlert
              document={isSending ? frozenDoc : existingDocument}
            />
            {!canShareByEmail && (
              <div className={styles['share-byemail-onlybylink']}>
                {t('Files.share.shareByEmail.onlyByLink', {
                  type: t(
                    `Files.share.shareByEmail.type.${
                      existingDocument?.type === 'file' ? 'file' : 'folder'
                    }`
                  )
                })}{' '}
                <strong>
                  {t(
                    `Files.share.shareByEmail.${
                      hasParentRestriction
                        ? 'hasSharedParent'
                        : 'hasSharedChild'
                    }`
                  )}
                </strong>
              </div>
            )}
            {canShareByEmail && (
              <>
                <Typography variant="h6" className="u-mt-1-half u-mb-half">
                  {t('Share.contacts.addUsers')}
                </Typography>
                <DumbShareByEmail
                  currentRecipients={
                    isSending ? frozenRecipients : existingRecipients
                  }
                  document={isSending ? frozenDoc : existingDocument}
                  documentType="Files"
                  pendingRecipients={pendingRecipients}
                  onPendingRecipientsChange={setPendingRecipients}
                  selectedOption={selectedOption}
                  onSelectedOptionChange={setSelectedOption}
                  enableCreateContact
                />
              </>
            )}
          </div>
          <WhoHasAccess
            isOwner
            isSharedDrive
            recipients={isSending ? frozenRecipients : existingRecipients}
            document={isSending ? frozenDoc : existingDocument}
            documentType="Files"
            className="u-w-100"
            onRevoke={revoke}
            link={displayedLink}
          />
        </div>
      }
      actions={
        <>
          <ShareByLink
            link={displayedLink}
            document={isSending ? frozenDoc : existingDocument}
            documentType="Files"
            showGenerateLinkButton={showGenerateLinkButton}
            autoOpenShareRestriction={autoOpenShareRestriction}
          />
          {canShareByEmail && (
            <Button
              variant="primary"
              label={t('FederatedFolder.share')}
              busy={isSending}
              onClick={onSend}
            />
          )}
        </>
      }
    />
  )
}

export const FederatedFolderModal = withLocales(props => (
  <ConfirmDialogProvider>
    <FederatedFolderModalContent {...props} />
  </ConfirmDialogProvider>
))

FederatedFolderModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  document: PropTypes.object.isRequired,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool
}

export default FederatedFolderModal
