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
    getRecipients,
    revokeSelf
  } = useSharingContext()

  const handleRevokeSelf = async document => {
    await revokeSelf(document)
    onRevokeSuccess?.(document)
  }

  const isEditable =
    !byDocId[document.id] || isOwner(document.id) || canReshare(document.id)

  if (isEditable) {
    const isFederatedMode = flag('drive.federated-shared-folder.enabled')
    if (isFederatedMode && document.driveId) {
      return (
        <FederatedFolderModal
          document={document}
          onRevokeSuccess={onRevokeSuccess}
          {...rest}
        />
      )
    }

    return <EditableSharingModal document={document} {...rest} />
  }

  return (
    <SharingDetailsModal
      recipients={getRecipients(document.id)}
      document={document}
      documentType={documentType}
      onRevoke={revokeSelf}
      onRevokeSelf={handleRevokeSelf}
      {...rest}
    />
  )
})

ShareModal.propTypes = {
  autoOpenShareRestriction: PropTypes.bool,
  document: PropTypes.object.isRequired,
  onRevokeSuccess: PropTypes.func,
  showGenerateLinkButton: PropTypes.bool
}
