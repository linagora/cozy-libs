import omit from 'lodash/omit'
import PropTypes from 'prop-types'
import React from 'react'
import { useLocation } from 'react-router'

import flag from 'cozy-flags'

import EditableSharingModal from './EditableSharingModal'
import SharingDetailsModal from './SharingDetailsModal'
import withLocales from '../../hoc/withLocales'
import { useSharingContext } from '../../hooks/useSharingContext'
import FederatedFolderModal from '../FederatedFolder/FederatedFolderModal'
import { ActivityReportContext } from '../ShareRestrictionModal/ActivityReportContext'

const ShareModalContent = props => {
  const location = useLocation?.()
  const locationProps = location?.state?.modalProps
  const document = locationProps?.document || props.document
  const {
    onRevokeSuccess,
    enableActivityReport = props.enableActivityReport ?? false,
    ...rest
  } = omit(locationProps || props, 'document')

  const {
    byDocId,
    isOwner,
    hasWriteAccess,
    documentType,
    getRecipients,
    revokeSelf,
    allLoaded
  } = useSharingContext()

  const handleRevokeSelf = async document => {
    await revokeSelf(document)
    onRevokeSuccess?.(document)
  }

  const isEditable =
    !byDocId[document.id] ||
    isOwner(document.id) ||
    hasWriteAccess(document.id, document.driveId)

  if (isEditable) {
    const isFederatedMode = flag('drive.federated-shared-folder.enabled')
    if (isFederatedMode && allLoaded) {
      return (
        <FederatedFolderModal
          document={document}
          onRevokeSuccess={onRevokeSuccess}
          enableActivityReport={enableActivityReport}
          {...rest}
        />
      )
    }

    return (
      <ActivityReportContext.Provider value={enableActivityReport}>
        <EditableSharingModal document={document} {...rest} />
      </ActivityReportContext.Provider>
    )
  }

  return (
    <ActivityReportContext.Provider value={enableActivityReport}>
      <SharingDetailsModal
        recipients={getRecipients(document.id)}
        document={document}
        documentType={documentType}
        onRevoke={revokeSelf}
        onRevokeSelf={handleRevokeSelf}
        {...rest}
      />
    </ActivityReportContext.Provider>
  )
}

export const ShareModal = withLocales(ShareModalContent)

ShareModal.propTypes = {
  autoOpenShareRestriction: PropTypes.bool,
  document: PropTypes.object.isRequired,
  enableActivityReport: PropTypes.bool,
  onRevokeSuccess: PropTypes.func
}
