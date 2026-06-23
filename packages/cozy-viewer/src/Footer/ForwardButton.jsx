import { Icon, Reply, ShareIos } from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import { useClient } from 'cozy-client'
import { makeSharingLink } from 'cozy-client/dist/models/sharing'
import { isIOS } from 'cozy-device-helper'
import Button from 'cozy-ui/transpiled/react/Buttons'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Alerter from 'cozy-ui/transpiled/react/deprecated/Alerter'
import { useI18n } from 'twake-i18n'

const ForwardIcon = isIOS() ? ShareIos : Reply

const ForwardButton = ({ file, variant, onClick }) => {
  const { t } = useI18n()
  const client = useClient()

  const icon = <Icon icon={ForwardIcon} />
  const label = t('Viewer.actions.forward')

  const onFileOpen = async file => {
    try {
      const url = await makeSharingLink(client, [file.id])
      const shareData = {
        title: t('Viewer.share.title', { name: file.name }),
        text: t('Viewer.share.text', { name: file.name }),
        url
      }
      navigator.share(shareData)
    } catch (error) {
      Alerter.error('Viewer.share.error', { error: error })
    }
  }

  const handleClick = () => {
    if (onClick) onClick()
    else onFileOpen(file)
  }

  if (variant === 'iconButton') {
    return (
      <IconButton className="u-white" aria-label={label} onClick={handleClick}>
        {icon}
      </IconButton>
    )
  }

  if (variant === 'buttonIcon') {
    return (
      <Button
        variant="secondary"
        label={icon}
        aria-label={label}
        onClick={handleClick}
      />
    )
  }

  return (
    <Button
      fullWidth
      variant="secondary"
      startIcon={icon}
      data-testid="openFileButton"
      label={label}
      onClick={handleClick}
    />
  )
}

ForwardButton.propTypes = {
  file: PropTypes.object.isRequired,
  variant: PropTypes.oneOf(['default', 'iconButton', 'buttonIcon']),
  onClick: PropTypes.func
}

ForwardButton.defaultProptypes = {
  variant: 'default'
}

export default ForwardButton
