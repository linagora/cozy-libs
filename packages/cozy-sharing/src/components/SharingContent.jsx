import cx from 'classnames'
import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import AntivirusAlert from './AntivirusAlert'
import { default as DumbShareByEmail } from './ShareByEmail'
import WhoHasAccess from './WhoHasAccess'
import styles from '../styles/share.styl'

const SharingContent = ({
  document,
  documentType,
  hasSharedParent,
  isOwner,
  onRevoke,
  onRevokeSelf,
  recipients,
  sharing,
  showShareByEmail,
  showShareOnlyByLink,
  showWhoHasAccess,
  recipientsToBeConfirmed,
  verifyRecipient,
  link,
  permissions,
  pendingRecipients,
  onPendingRecipientsChange,
  selectedOption,
  onSelectedOptionChange
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()

  return (
    <div className={cx(styles['share-modal-content'])}>
      <div className={cx('u-pt-1-half', isMobile ? 'u-ph-1' : 'u-ph-2')}>
        <AntivirusAlert document={document} />
        {showShareOnlyByLink && (
          <div className={styles['share-byemail-onlybylink']}>
            {t(`${documentType}.share.shareByEmail.onlyByLink`, {
              type: t(
                `${documentType}.share.shareByEmail.type.${
                  document.type === 'directory' ? 'folder' : 'file'
                }`
              )
            })}{' '}
            <strong>
              {t(
                `${documentType}.share.shareByEmail.${
                  hasSharedParent ? 'hasSharedParent' : 'hasSharedChild'
                }`
              )}
            </strong>
          </div>
        )}
        <Typography variant="h6" className="u-mb-half">
          {t('Share.contacts.addUsers')}
        </Typography>
        {showShareByEmail && (
          <DumbShareByEmail
            currentRecipients={recipients}
            document={document}
            documentType={documentType}
            sharing={sharing}
            pendingRecipients={pendingRecipients}
            onPendingRecipientsChange={onPendingRecipientsChange}
            selectedOption={selectedOption}
            onSelectedOptionChange={onSelectedOptionChange}
            enableCreateContact
          />
        )}
      </div>
      {showWhoHasAccess && (
        <WhoHasAccess
          document={document}
          documentType={documentType}
          isOwner={isOwner}
          onRevoke={onRevoke}
          onRevokeSelf={onRevokeSelf}
          recipients={recipients}
          recipientsToBeConfirmed={recipientsToBeConfirmed}
          verifyRecipient={verifyRecipient}
          link={link}
          permissions={permissions}
        />
      )}
    </div>
  )
}

export default SharingContent
