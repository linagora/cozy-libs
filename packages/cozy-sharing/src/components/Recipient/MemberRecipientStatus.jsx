import PropTypes from 'prop-types'
import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { getMemberStatusText } from '../../helpers/recipients'

const MemberRecipientStatus = ({
  status,
  isMe,
  instance,
  email,
  name,
  isOrgSharedDrive,
  typographyProps
}) => {
  const { t } = useI18n()

  const text = getMemberStatusText({
    t,
    status,
    isMe,
    instance,
    email,
    name,
    isOrgSharedDrive
  })

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
  name: PropTypes.string,
  isOrgSharedDrive: PropTypes.bool,
  typographyProps: PropTypes.object
}

export default MemberRecipientStatus
