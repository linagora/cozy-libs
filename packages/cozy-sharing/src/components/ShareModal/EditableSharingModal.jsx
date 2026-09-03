import PropTypes from 'prop-types'
import React, { useEffect } from 'react'

import { useClient } from 'cozy-client'
import flag from 'cozy-flags'
import minilog from 'cozy-minilog'

import { useFetchDocumentPath } from '../../hooks/useFetchDocumentPath'
import { useSharingContext } from '../../hooks/useSharingContext'
import { Contact } from '../../models'
import { ShareModal } from '../ShareModal'

export const EditableSharingModal = ({ document, recipients, ...rest }) => {
  const client = useClient()
  const isFederatedMode = flag('drive.federated-shared-folder.enabled')
  const documentPath = useFetchDocumentPath(client, document)

  const {
    documentType,
    getDocumentPermissions,
    getSharingForSelf,
    getSharingLink,
    hasSharedChild,
    hasSharedParent,
    isOwner,
    revoke,
    revokeSelf,
    share
  } = useSharingContext()

  return (
    <ShareModal
      createContact={contact => client.create(Contact.doctype, contact)}
      document={document}
      documentType={documentType}
      hasSharedChild={
        isFederatedMode
          ? undefined
          : documentPath && hasSharedChild(documentPath)
      }
      hasSharedParent={
        isFederatedMode
          ? undefined
          : documentPath && hasSharedParent(documentPath)
      }
      isOwner={isOwner(document._id)}
      link={getSharingLink(document._id)}
      onRevoke={revoke}
      onRevokeSelf={revokeSelf}
      onShare={share}
      permissions={getDocumentPermissions(document._id)}
      recipients={recipients}
      sharing={getSharingForSelf(document._id)}
      {...rest}
    />
  )
}

EditableSharingModal.propTypes = {
  document: PropTypes.object,
  recipients: PropTypes.array
}

export const EditableSharingModalWrapper = ({ document, ...rest }) => {
  const log = minilog('EditableSharingModal')
  const isFederatedMode = flag('drive.federated-shared-folder.enabled')
  const {
    getRecipients,
    getEffectiveRecipients,
    fetchEffectiveRecipients,
    invalidateEffectiveRecipients
  } = useSharingContext()

  const fileId = document._id || document.id

  useEffect(() => {
    if (isFederatedMode && fileId) {
      fetchEffectiveRecipients(fileId, document.driveId).catch(log.error)
    }
    return () => {
      if (fileId) {
        invalidateEffectiveRecipients(fileId)
      }
    }
  }, [
    fileId,
    document.driveId,
    isFederatedMode,
    fetchEffectiveRecipients,
    invalidateEffectiveRecipients
  ])

  const recipients = isFederatedMode
    ? getEffectiveRecipients(fileId)
    : getRecipients(fileId)

  return (
    <EditableSharingModal
      document={document}
      recipients={recipients}
      {...rest}
    />
  )
}

export default EditableSharingModalWrapper
