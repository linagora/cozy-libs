import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React from 'react'
import { useLocation } from 'react-router'

import flag from 'cozy-flags'

import EditableSharingModal from './EditableSharingModal'
import { SharingDetailsModal } from './SharingDetailsModal'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import { FederatedFolderModal } from '../FederatedFolder/FederatedFolderModal'

export const ShareModal = withLocales(props => {
  const location = useLocation?.()
  const locationProps = location?.state?.modalProps
  const document = locationProps?.document || props.document
  const { onRevokeSuccess, ...rest } = omit(locationProps || props, 'document')

  const {
    byDocId,
    isOwner,
    canReshare,
    documentType,
    getOwner,
    getSharingType,
    getRecipients,
    revokeSelf,
    allLoaded
  } = useSharingContext()

  const handleRevokeSelf = async document => {
    await revokeSelf(document)
    onRevokeSuccess?.(document)
  }

  const isFederatedMode = flag('drive.federated-shared-folder.enabled')
  const hasSharings = byDocId[document.id]?.sharings?.length > 0

  // In federated mode, show FederatedFolderModal for unshared documents (sharing an existing folder).
  // When isFederatedMode && hasSharings is true, we intentionally fall through to the legacy
  // modals (EditableSharingModal / SharingDetailsModal) because federated-shared folders are
  // handled by those components.
  if (isFederatedMode && allLoaded && !hasSharings) {
    return <FederatedFolderModal document={document} onClose={rest.onClose} />
  }

  const isEditable =
    !byDocId[document.id] || isOwner(document.id) || canReshare(document.id)

  if (isEditable) {
    return <EditableSharingModal document={document} {...rest} />
  }

  return (
    <SharingDetailsModal
      document={document}
      documentType={documentType}
      owner={getOwner(document.id)}
      sharingType={getSharingType(document.id)}
      recipients={getRecipients(document.id)}
      onRevoke={revokeSelf}
      onRevokeSelf={handleRevokeSelf}
      {...rest}
    />
  )
})

ShareModal.propTypes = {
  document: PropTypes.object.isRequired,
  onRevokeSuccess: PropTypes.func
}
