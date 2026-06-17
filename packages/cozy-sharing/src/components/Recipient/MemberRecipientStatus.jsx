import PropTypes from 'prop-types'
import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

const MemberRecipientStatus = ({
  status,
  isMe,
  instance,
  email,
  typographyProps
}) => {
  const { t } = useI18n()

  const isSendingEmail = !isMe && status === 'mail-not-sent'
  const isReady = isMe || status === 'ready' || status === 'owner'
  let text
  if (isReady) {
    text = email || instance
  } else if (isSendingEmail) {
    text = t('Share.status.mail-not-sent')
  } else {
    const supportedStatus = ['pending', 'seen']
    text = supportedStatus.includes(status)
      ? t(`Share.status.${status}`)
      : t('Share.status.pending')
  }

  return (
    <Typography variant="caption" color="textSecondary" {...typographyProps}>
      {text}
    </Typography>
  )
}

MemberRecipientStatus.propTypes = {
  status: PropTypes.string,
  isMe: PropTypes.bool,
  instance: PropTypes.string,
  email: PropTypes.string,
  typographyProps: PropTypes.object
}

export default MemberRecipientStatus
