import PropTypes from 'prop-types'
import React from 'react'

import flag from 'cozy-flags'
import { useI18n } from 'twake-i18n'

import ShareRecipientsInput from './ShareRecipientsInput'
import ShareTypeSelect from './Sharetypeselect'
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
  sharing
}) => {
  const { t } = useI18n()

  const onRecipientPick = recipient => {
    const merged = flag('sharing.show-recipient-groups')
      ? mergeRecipients(pendingRecipients, recipient)
      : spreadGroupAndMergeRecipients(pendingRecipients, recipient)
    onPendingRecipientsChange(merged)
  }

  const onRecipientRemove = recipient => {
    const idx = pendingRecipients.findIndex(r => r === recipient)
    onPendingRecipientsChange([
      ...pendingRecipients.slice(0, idx),
      ...pendingRecipients.slice(idx + 1)
    ])
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

  return (
    <div className={styles['coz-form-group']}>
      <div className={styles['coz-form']}>
        <ShareRecipientsInput
          placeholder={
            pendingRecipients.length === 0
              ? t(`${documentType}.share.shareByEmail.emailPlaceholder`)
              : ''
          }
          onPick={onRecipientPick}
          onRemove={onRecipientRemove}
          enableCreateContact={enableCreateContact}
          currentRecipients={currentRecipients}
          recipients={pendingRecipients}
          endAdornment={
            <ShareTypeSelect
              value={selectedOption}
              options={getSharingOptions()}
              onChange={onSelectedOptionChange}
            />
          }
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
  sharing: PropTypes.object
}

export default ShareByEmail
