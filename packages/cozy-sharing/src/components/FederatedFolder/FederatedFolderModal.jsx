import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { useI18n } from 'twake-i18n'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import { DumbFederatedFolderModal } from './DumbFederatedFolderModal'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import {
  formatRecipients,
  moveRecipientToReadWrite,
  moveRecipientToReadOnly,
  RECIPIENT_INDEX_PREFIX
} from '../SharedDrive/helpers'

export const FederatedFolderModal = withLocales(
  ({ onClose, document: existingDocument }) => {
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
    ]) // eslint-disable-line react-hooks/exhaustive-deps

    const [federatedRecipients, setFederatedRecipients] = useState({
      recipients: [],
      readOnlyRecipients: []
    })
    const [folderName] = useState(existingDocument?.name || '')

    const onShare = params => {
      setFederatedRecipients({
        recipients: params.recipients || [],
        readOnlyRecipients: params.readOnlyRecipients || []
      })
    }

    const onSend = async () => {
      try {
        await share({
          description: folderName,
          document: existingDocument,
          recipients: federatedRecipients.recipients,
          readOnlyRecipients: federatedRecipients.readOnlyRecipients,
          sharedDrive: true,
          openSharing: false
        })

        showAlert({
          message: t('FederatedFolder.successNotification'),
          severity: 'success',
          variant: 'filled'
        })

        onClose()
      } catch (err) {
        showAlert({
          message: t('FederatedFolder.errorNotification'),
          severity: 'error',
          variant: 'filled'
        })
      }
    }

    const onSetType = (index, newType) => {
      const _id = index.split(RECIPIENT_INDEX_PREFIX)[1]

      if (newType === 'two-way') {
        setFederatedRecipients(prev => moveRecipientToReadWrite(prev, _id))
      } else {
        setFederatedRecipients(prev => moveRecipientToReadOnly(prev, _id))
      }
    }

    const onRevoke = async (documentOrIndex, sharingId, memberIndex) => {
      if (
        typeof documentOrIndex === 'string' &&
        documentOrIndex.startsWith(RECIPIENT_INDEX_PREFIX)
      ) {
        const _id = documentOrIndex.split(RECIPIENT_INDEX_PREFIX)[1]
        setFederatedRecipients(prev => ({
          recipients: prev.recipients.filter(r => r._id !== _id),
          readOnlyRecipients: prev.readOnlyRecipients.filter(r => r._id !== _id)
        }))
      } else {
        await revoke(documentOrIndex, sharingId, memberIndex)
      }
    }

    const existingRecipients = existingDocument
      ? getRecipients(existingDocument._id)
      : []

    const recipients = [
      ...existingRecipients,
      ...formatRecipients(federatedRecipients)
    ]

    const modalTitle = t('FederatedFolder.shareTitle', { name: folderName })

    const isSharedDrive = Boolean(existingDocument?.driveId)

    return (
      <DumbFederatedFolderModal
        title={modalTitle}
        document={existingDocument}
        createContact={contact => client.create('io.cozy.contacts', contact)}
        recipients={recipients}
        readOnlyRecipients={federatedRecipients.readOnlyRecipients}
        currentRecipients={existingRecipients}
        onRevoke={onRevoke}
        onSetType={onSetType}
        onSend={onSend}
        onClose={onClose}
        onShare={onShare}
        sharingLink={sharingLink}
        showShareByEmail={!isSharedDrive}
      />
    )
  }
)

FederatedFolderModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  document: PropTypes.object.isRequired
}

export default FederatedFolderModal
