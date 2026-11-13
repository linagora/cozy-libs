import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useState } from 'react'

import minilog from 'cozy-minilog'
import Button from 'cozy-ui/transpiled/react/Buttons'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import ConfirmDialogProvider, {
  useConfirmDialog
} from 'cozy-ui/transpiled/react/providers/ConfirmDialog'
import { useI18n } from 'twake-i18n'

import { includeDirectGroups } from '../../helpers/effectiveRecipients'
import withLocales from '../../hoc/withLocales'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { useResolveRecipients } from '../../hooks/useResolveRecipients'
import { useSharingContext } from '../../hooks/useSharingContext'
import styles from '../../styles/share.styl'
import AntivirusAlert from '../AntivirusAlert'
import { default as DumbShareByEmail } from '../ShareByEmail'
import ShareByLink from '../ShareByLink'
import { ActivityReportContext } from '../ShareRestrictionModal/ActivityReportContext'
import WhoHasAccessWrapper from '../WhoHasAccessWrapper'

const log = minilog('FederatedFolderModal')

const FederatedFolderModalContent = ({
  onClose,
  onRevokeSuccess,
  document: existingDocument,
  recipients,
  hasLoadedRecipients,
  autoOpenShareRestriction
}) => {
  // share from CozyProvider is wired to callbacks and realtime that
  // makes existingDocument and existingRecipients reactive to changes.
  // But we want it to be reactive only when we revoke a member. When we add member
  // we close the popup and we do not want to see briefly the new contacts added
  // in members before the modal closes. That's why when clicking on "Share"
  // we do not use the reactive existingDocument and existingRecipients.
  const resolveRecipients = useResolveRecipients()
  const { t } = useI18n()
  const {
    canReshare,
    hasWriteAccess,
    share,
    getSharingById,
    getSharingLink,
    getFederatedShareLink,
    getDocumentPermissions,
    fetchSharedDriveSharingLinks,
    isOwner,
    revoke,
    revokeSelf
  } = useSharingContext()
  const { showAlert } = useAlert()
  const { showConfirmDialog, closeConfirmDialog } = useConfirmDialog()
  const {
    pendingRecipients,
    setPendingRecipients,
    selectedOption,
    setSelectedOption
  } = usePendingRecipients()
  const [isSending, setIsSending] = useState(false)
  const [isFetchingSharingLinks, setIsFetchingSharingLinks] = useState(false)
  const [fetchedSharingLinksDocumentId, setFetchedSharingLinksDocumentId] =
    useState(null)
  const [frozenDoc, setFrozenDoc] = useState(null)
  const [frozenRecipients, setFrozenRecipients] = useState(null)

  const documentId = existingDocument?._id || existingDocument?.id
  const folderName = existingDocument?.name || ''
  const sharedDriveSharing = existingDocument?.driveId
    ? getSharingById(existingDocument.driveId)
    : null
  const sharedDriveRootIds =
    sharedDriveSharing?.attributes?.rules?.reduce(
      (ids, rule) => ids.concat(rule.values || []),
      []
    ) || []

  const documentPermissions = documentId
    ? getDocumentPermissions(documentId)
    : []
  const displayedLink = existingDocument?.driveId
    ? getFederatedShareLink(existingDocument)
    : getSharingLink(existingDocument?._id)

  const isSharedDriveRoot = Boolean(
    existingDocument?.driveId &&
    sharedDriveRootIds.some(
      id => id === existingDocument?._id || id === existingDocument?.id
    )
  )
  // Ignore a stale driveId left after an owner revokes the last recipient, so their own folder isn't wrongly restricted to link-only (linagora/twake-drive#4264).
  const isInsideSharedDrive = Boolean(
    existingDocument?.driveId &&
    !isSharedDriveRoot &&
    (sharedDriveSharing || !isOwner(documentId))
  )
  const isCurrentUserOwner = existingDocument?.driveId
    ? Boolean(sharedDriveSharing?.attributes?.owner)
    : documentId
      ? isOwner(documentId)
      : false
  const isMemberReadOnly =
    isInsideSharedDrive &&
    !isCurrentUserOwner &&
    !hasWriteAccess(documentId, existingDocument?.driveId)
  const canManageSharing =
    isCurrentUserOwner || (documentId ? canReshare(documentId) : false)

  const handleRevokeSelf = async document => {
    await revokeSelf(document)
    onRevokeSuccess?.(document)
  }

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

  const onSend = async () => {
    if (isSending || pendingRecipients.length === 0) return

    setIsSending(true)
    setFrozenDoc(existingDocument)
    setFrozenRecipients(recipients)

    try {
      const { recipients: readWriteRecipients, readOnlyRecipients } =
        await resolveRecipients(pendingRecipients, selectedOption)

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

      setPendingRecipients([])
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

  useEffect(() => {
    if (!existingDocument?.driveId) return
    if (!documentId) return
    if (!fetchSharedDriveSharingLinks) return
    if (documentPermissions.length > 0) return
    if (isFetchingSharingLinks) return
    if (fetchedSharingLinksDocumentId === documentId) return

    const fetchSharingLinks = async () => {
      setIsFetchingSharingLinks(true)

      try {
        await fetchSharedDriveSharingLinks(existingDocument)
      } catch (error) {
        log.error('Failed to fetch shared drive sharing links', error)
      } finally {
        setFetchedSharingLinksDocumentId(documentId)
        setIsFetchingSharingLinks(false)
      }
    }

    fetchSharingLinks()
  }, [
    documentId,
    existingDocument,
    documentPermissions.length,
    fetchedSharingLinksDocumentId,
    fetchSharedDriveSharingLinks,
    isFetchingSharingLinks
  ])

  return (
    <FixedDialog
      open
      disableGutters
      onClose={handleCloseRequest}
      title={t('FederatedFolder.shareTitle', { name: folderName })}
      classes={{ paper: 'u-ov-visible' }}
      componentsProps={{
        dialogContent: {
          className: styles['share-dialog-scrollable-content']
        }
      }}
      content={
        <div className={styles['share-dialog-scrollable-body']}>
          <div className="u-ph-2">
            <AntivirusAlert
              document={isSending ? frozenDoc : existingDocument}
            />
            {isMemberReadOnly ? (
              <div className={styles['share-byemail-onlybylink']}>
                {t('Files.share.shareByEmail.onlyByLink', {
                  type: t(
                    `Files.share.shareByEmail.type.${
                      existingDocument?.type === 'file' ? 'file' : 'folder'
                    }`
                  )
                })}{' '}
                <strong>{t('Files.share.shareByEmail.hasSharedParent')}</strong>
              </div>
            ) : (
              <div className="u-mt-1-half">
                <DumbShareByEmail
                  currentRecipients={isSending ? frozenRecipients : recipients}
                  document={isSending ? frozenDoc : existingDocument}
                  documentType="Files"
                  pendingRecipients={pendingRecipients}
                  selectedOption={selectedOption}
                  enableCreateContact
                  title={t('Share.contacts.addUsers')}
                  isSending={isSending}
                  onPendingRecipientsChange={setPendingRecipients}
                  onSelectedOptionChange={setSelectedOption}
                  onSend={onSend}
                />
              </div>
            )}
          </div>
          <WhoHasAccessWrapper
            showEmptyState={hasLoadedRecipients}
            showPublicAccess
            isAutoOpenSettings={autoOpenShareRestriction}
            isOwner={isCurrentUserOwner}
            canManageSharing={canManageSharing}
            canManageMembers={!isMemberReadOnly}
            canManageLink={true}
            recipients={isSending ? frozenRecipients : recipients}
            document={isSending ? frozenDoc : existingDocument}
            documentType="Files"
            className={`${styles['share-dialog-members']} u-flex u-flex-column`}
            onRevoke={revoke}
            onRevokeSelf={handleRevokeSelf}
            link={displayedLink}
          />
        </div>
      }
      actions={
        <ShareByLink
          link={displayedLink}
          document={isSending ? frozenDoc : existingDocument}
          documentType="Files"
          isAutoOpenSettings={autoOpenShareRestriction}
        />
      }
    />
  )
}

FederatedFolderModalContent.propTypes = {
  onClose: PropTypes.func.isRequired,
  onRevokeSuccess: PropTypes.func,
  document: PropTypes.object.isRequired,
  recipients: PropTypes.array,
  hasLoadedRecipients: PropTypes.bool,
  autoOpenShareRestriction: PropTypes.bool
}

const FederatedFolderModalWrapper = ({ document, ...props }) => {
  const fileId = document._id || document.id
  const {
    getRecipients,
    getEffectiveRecipients,
    hasLoadedEffectiveRecipients,
    fetchEffectiveRecipients,
    invalidateEffectiveRecipients
  } = useSharingContext()

  useEffect(() => {
    fetchEffectiveRecipients(fileId, document.driveId).catch(log.error)
    return () => {
      invalidateEffectiveRecipients(fileId)
    }
  }, [
    fileId,
    document.driveId,
    fetchEffectiveRecipients,
    invalidateEffectiveRecipients
  ])

  const recipients = includeDirectGroups(
    getEffectiveRecipients(fileId),
    getRecipients(fileId)
  )
  const hasLoadedRecipients = hasLoadedEffectiveRecipients(fileId)

  return (
    <FederatedFolderModalContent
      document={document}
      recipients={recipients}
      hasLoadedRecipients={hasLoadedRecipients}
      {...props}
    />
  )
}

export const FederatedFolderModal = withLocales(
  ({ enableActivityReport = false, ...props }) => (
    <ActivityReportContext.Provider value={enableActivityReport}>
      <ConfirmDialogProvider>
        <FederatedFolderModalWrapper {...props} />
      </ConfirmDialogProvider>
    </ActivityReportContext.Provider>
  )
)

FederatedFolderModal.propTypes = {
  enableActivityReport: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onRevokeSuccess: PropTypes.func,
  document: PropTypes.object.isRequired,
  autoOpenShareRestriction: PropTypes.bool
}

export default FederatedFolderModal
