import PropTypes from 'prop-types'
import React from 'react'

import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useI18n } from 'twake-i18n'

import { useSharingContext } from '../../hooks/useSharingContext'
import styles from '../../styles/share.styl'
import ShareByLink from '../ShareByLink'
import WhoHasAccess from '../WhoHasAccess'

export const SharingDetailsModal = ({
  recipients,
  document,
  documentType = 'Document',
  onRevoke,
  onRevokeSelf,
  onClose
}) => {
  const { t } = useI18n()
  const { getSharingLink, getFederatedShareLink } = useSharingContext()

  const isSharedDrive = Boolean(document?.driveId)
  const displayedLink = isSharedDrive
    ? getFederatedShareLink(document)
    : getSharingLink(document?._id)

  return (
    <FixedDialog
      disableGutters
      open={true}
      onClose={onClose}
      className={styles['share-modal']}
      title={t(`${documentType}.share.details.title`)}
      content={
        <div className={styles['share-modal-content']}>
          <WhoHasAccess
            canManageMembers={false}
            canManageLink={isSharedDrive}
            isSharedDrive={isSharedDrive}
            recipients={recipients}
            document={document}
            documentType={documentType}
            onRevoke={onRevoke}
            onRevokeSelf={onRevokeSelf}
            link={displayedLink}
          />
        </div>
      }
      actions={
        isSharedDrive && (
          <ShareByLink
            link={displayedLink}
            document={document}
            documentType="Files"
            showGenerateLinkButton={true}
            autoOpenShareRestriction={false}
          />
        )
      }
    />
  )
}

SharingDetailsModal.propTypes = {
  recipients: PropTypes.array.isRequired,
  document: PropTypes.object.isRequired,
  documentType: PropTypes.string.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onRevokeSelf: PropTypes.func,
  onClose: PropTypes.func
}
export default SharingDetailsModal
