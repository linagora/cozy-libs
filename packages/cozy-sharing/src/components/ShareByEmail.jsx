import PropTypes from 'prop-types'
import React from 'react'

import flag from 'cozy-flags'
import { useI18n } from 'twake-i18n'

import ShareAutosuggestWrapper from './ShareAutosuggestWrapper'
import {
  mergeRecipients,
  spreadGroupAndMergeRecipients
} from '../helpers/recipients'
import { isReadOnlySharing } from '../state'
import styles from '../styles/share.styl'

export const ShareByEmail = ({
  document,
  documentType,
  currentRecipients,
  pendingRecipients,
  onPendingRecipientsChange,
  selectedOption,
  onSelectedOptionChange,
  enableCreateContact,
  autoFocus,
  sharing
}) => {
  const { t } = useI18n()

  const onRecipientsChange = recipients => {
    const merge = flag('sharing.show-recipient-groups')
      ? mergeRecipients
      : spreadGroupAndMergeRecipients
    const keptRecipients = pendingRecipients.filter(recipient =>
      recipients.includes(recipient)
    )
    const addedRecipients = recipients.filter(
      recipient => !pendingRecipients.includes(recipient)
    )
    onPendingRecipientsChange(addedRecipients.reduce(merge, keptRecipients))
  }

  const getSharingOptions = () => {
    const isSharingReadOnly = sharing
      ? isReadOnlySharing(sharing, document?._id)
      : false
    const readWrite = {
      value: 'readWrite',
      label: t('Share.type.two-way')
    }
    const readOnly = {
      value: 'readOnly',
      label: t('Share.type.one-way')
    }
    return isSharingReadOnly ? [readOnly] : [readWrite, readOnly]
  }

  const roles = getSharingOptions()

  return (
    <div className={styles['coz-form-group']}>
      <div className={styles['coz-form']}>
        <ShareAutosuggestWrapper
          placeholder={t(`${documentType}.share.shareByEmail.emailPlaceholder`)}
          enableCreateContact={enableCreateContact}
          currentRecipients={currentRecipients}
          recipients={pendingRecipients}
          autoFocus={autoFocus}
          roles={roles}
          role={selectedOption}
          onChange={onRecipientsChange}
          onRoleChange={onSelectedOptionChange}
        />
      </div>
    </div>
  )
}

ShareByEmail.propTypes = {
  currentRecipients: PropTypes.arrayOf(PropTypes.object),
  document: PropTypes.object,
  documentType: PropTypes.string.isRequired,
  pendingRecipients: PropTypes.array.isRequired,
  onPendingRecipientsChange: PropTypes.func.isRequired,
  selectedOption: PropTypes.oneOf(['readWrite', 'readOnly']).isRequired,
  onSelectedOptionChange: PropTypes.func.isRequired,
  enableCreateContact: PropTypes.bool,
  autoFocus: PropTypes.bool,
  sharing: PropTypes.object
}

export default ShareByEmail
