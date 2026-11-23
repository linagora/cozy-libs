import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'

import Paper from 'cozy-ui/transpiled/react/Paper'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import styles from '../styles/CozyPassFingerprintDialogContent.styl'

// The recipient name and email come from another user: they are rendered as
// React text, so they are never interpreted as HTML.
const renderWithBoldValues = (text, values) =>
  text
    .split(/%\{(.*?)\}/)
    .map((part, index) =>
      index % 2 ? (
        <strong key={index}>{values[part] ?? `%{${part}}`}</strong>
      ) : (
        part
      )
    )

/**
 * CozyPassFingerprintDialogContent can be use as a content for ShareModal when
 * using 2 steps confirmation
 *
 * This should be the case when ShareModal is called from `cozy-pass-web`
 */
export const CozyPassFingerprintDialogContent = ({
  recipientConfirmationData
}) => {
  const { t } = useI18n()

  return (
    <div className={cx(styles['share-modal-content'])}>
      <p>
        {renderWithBoldValues(t('Organizations.fingerprint.instruction'), {
          userName: recipientConfirmationData.name,
          userEmail: recipientConfirmationData.email
        })}
      </p>
      <p>{t('Organizations.fingerprint.securityCode')}</p>
      <Paper
        className={cx(styles['cozy-pass-fingerprint-modal__fingerprint'])}
        elevation={1}
      >
        <Typography variant="body1">
          {recipientConfirmationData.fingerprintPhrase}
        </Typography>
      </Paper>
      <p>{t('Organizations.fingerprint.instruction2')}</p>
    </div>
  )
}

CozyPassFingerprintDialogContent.propTypes = {
  recipientConfirmationData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    fingerprintPhrase: PropTypes.string.isRequired
  })
}
