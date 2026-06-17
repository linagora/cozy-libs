import PropTypes from 'prop-types'
import React from 'react'

import { Dialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useI18n } from 'twake-i18n'

import styles from '../../styles/share.styl'
import WhoHasAccess from '../WhoHasAccess'

export const SharingDetailsModal = ({
  onClose,
  recipients,
  document,
  documentType = 'Document',
  onRevoke,
  onRevokeSelf
}) => {
  const { t } = useI18n()

  return (
    <Dialog
      disableGutters
      open={true}
      onClose={onClose}
      className={styles['share-modal']}
      title={t(`${documentType}.share.details.title`)}
      content={
        <div className={styles['share-modal-content']}>
          <WhoHasAccess
            isReadOnly
            recipients={recipients}
            document={document}
            documentType={documentType}
            onRevoke={onRevoke}
            onRevokeSelf={onRevokeSelf}
            link="ok"
          />
        </div>
      }
    />
  )
}

SharingDetailsModal.propTypes = {
  onClose: PropTypes.func,
  sharingType: PropTypes.string,
  owner: PropTypes.object.isRequired,
  document: PropTypes.object.isRequired,
  documentType: PropTypes.string.isRequired,
  onRevoke: PropTypes.func.isRequired,
  onRevokeSelf: PropTypes.func
}
export default SharingDetailsModal
