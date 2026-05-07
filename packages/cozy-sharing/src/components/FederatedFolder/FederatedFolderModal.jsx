import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { DumbFederatedFolderModal } from './DumbFederatedFolderModal'
import withLocales from '../../hoc/withLocales'
import { getOrCreateFromArray } from '../../helpers/contacts'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { useSharingContext } from '../../hooks/useSharingContext'

export const FederatedFolderModal = withLocales(
  ({
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
      getDocumentPermissions,
      getOwner,
      getSharingById,
      getRecipients,
      revoke
    } = useSharingContext()
    const { showAlert } = useAlert()

    const [sharingLink, setSharingLink] = useState(null)
    const {
      pendingRecipients,
      setPendingRecipients,
      selectedOption,
      setSelectedOption
    } = usePendingRecipients()

    const documentPermissions = existingDocument
      ? getDocumentPermissions(existingDocument._id)
      : []

    useEffect(() => {
      const fetchSharingLink = async () => {
        if (!existingDocument) return

        if (existingDocument.driveId) {
          const link = await getFederatedShareLink(existingDocument)
          setSharingLink(link)
        } else {
          setSharingLink(getSharingLink(existingDocument._id))
        }
      }

      fetchSharingLink()
    }, [
      existingDocument,
      documentPermissions,
      getFederatedShareLink,
      getSharingLink,
      getOwner,
      getSharingById
    ])

    const folderName = existingDocument?.name || ''

    const onSend = async () => {
      if (pendingRecipients.length === 0) {
        onClose()
        return
      }

      try {
        const contacts = await getOrCreateFromArray(
          client,
          pendingRecipients,
          contact => client.create('io.cozy.contacts', contact)
        )
        const readWriteRecipients =
          selectedOption === 'readOnly' ? [] : contacts
        const readOnlyRecipients =
          selectedOption === 'readOnly' ? contacts : []

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
      }
    }

    const existingRecipients = existingDocument
      ? getRecipients(existingDocument._id)
      : []

    const modalTitle = t('FederatedFolder.shareTitle', { name: folderName })
    const isSharedDrive = Boolean(existingDocument?.driveId)

    return (
      <DumbFederatedFolderModal
        title={modalTitle}
        document={existingDocument}
        recipients={existingRecipients}
        currentRecipients={existingRecipients}
        onRevoke={revoke}
        onSend={onSend}
        onClose={onClose}
        sharingLink={sharingLink}
        showShareByEmail={!isSharedDrive}
        autoOpenShareRestriction={autoOpenShareRestriction}
        showGenerateLinkButton={showGenerateLinkButton}
        pendingRecipients={pendingRecipients}
        onPendingRecipientsChange={setPendingRecipients}
        selectedOption={selectedOption}
        onSelectedOptionChange={setSelectedOption}
      />
    )
  }
)

FederatedFolderModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  document: PropTypes.object.isRequired,
  autoOpenShareRestriction: PropTypes.bool,
  showGenerateLinkButton: PropTypes.bool
}

export default FederatedFolderModal
