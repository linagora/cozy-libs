import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { useI18n } from 'twake-i18n'

import { useClient } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import { DumbFederatedFolderModal } from './DumbFederatedFolderModal'
import { getShortcode } from '../../helpers/shortcodes'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import { generateShareLinkFromFile } from '../ShareRestrictionModal/helpers'
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
      getOwner,
      getSharingById,
      getDocumentPermissions,
      documentType
    } = useSharingContext()
    const { showAlert } = useAlert()

    // Get sharing link
    const getSharingLinkMemo = () => {
      if (!existingDocument) return null

      if (existingDocument.driveId) {
        const permissions = getDocumentPermissions(existingDocument._id)
        const perm = permissions[0]
        if (!perm) return null

        const code = getShortcode(perm)

        if (!code) return null

        return generateShareLinkFromFile({
          client,
          file: existingDocument,
          sharecode: code,
          getOwner,
          getSharingById,
          documentType
        })
      }

      return getSharingLink(existingDocument._id)
    }

    const sharingLink = getSharingLinkMemo()

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

    const onRevoke = index => {
      const _id = index.split(RECIPIENT_INDEX_PREFIX)[1]

      setFederatedRecipients(prev => {
        return {
          recipients: prev.recipients.filter(r => r._id !== _id),
          readOnlyRecipients: prev.readOnlyRecipients.filter(r => r._id !== _id)
        }
      })
    }

    const recipients = formatRecipients(federatedRecipients)

    const modalTitle = t('FederatedFolder.shareTitle', { name: folderName })

    const isSharedDrive = Boolean(existingDocument?.driveId)

    return (
      <DumbFederatedFolderModal
        title={modalTitle}
        document={existingDocument}
        createContact={contact => client.create('io.cozy.contacts', contact)}
        recipients={recipients}
        readOnlyRecipients={federatedRecipients.readOnlyRecipients}
        currentRecipients={[]}
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
