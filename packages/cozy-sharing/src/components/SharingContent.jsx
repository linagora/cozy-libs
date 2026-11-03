import cx from 'classnames'
import React from 'react'

import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import AntivirusAlert from './AntivirusAlert'
import { default as DumbShareByEmail } from './ShareByEmail'
import WhoHasAccessWrapper from './WhoHasAccessWrapper'
import styles from '../styles/share.styl'

const SharingContent = ({
  document,
  documentType,
  hasSharedParent,
  hasLoadedRecipients = true,
  isOwner,
  recipients,
  sharing,
  showShareByEmail,
  showShareOnlyByLink,
  showWhoHasAccess,
  recipientsToBeConfirmed,
  verifyRecipient,
  link,
  pendingRecipients,
  selectedOption,
  isSending,
  onRevoke,
  onRevokeSelf,
  onPendingRecipientsChange,
  onSelectedOptionChange,
  onSend
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const isEmptyStateShown = showShareByEmail && hasLoadedRecipients

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
        {showShareByEmail && (
          <DumbShareByEmail
            currentRecipients={recipients}
            document={document}
            documentType={documentType}
            sharing={sharing}
            pendingRecipients={pendingRecipients}
            selectedOption={selectedOption}
            enableCreateContact
            title={t('Share.contacts.addUsers')}
            isSending={isSending}
            onPendingRecipientsChange={onPendingRecipientsChange}
            onSelectedOptionChange={onSelectedOptionChange}
            onSend={onSend}
          />
        )}
      </div>
      {showWhoHasAccess && (
        <WhoHasAccessWrapper
          showEmptyState={isEmptyStateShown}
          document={document}
          documentType={documentType}
          isOwner={isOwner}
          onRevoke={onRevoke}
          onRevokeSelf={onRevokeSelf}
          recipients={recipients}
          recipientsToBeConfirmed={recipientsToBeConfirmed}
          verifyRecipient={verifyRecipient}
          link={link}
        />
      )}
    </div>
  )
}

export default SharingContent
