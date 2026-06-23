import { Icon, Share } from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import { ShareButton } from 'cozy-sharing'
import IconButton from 'cozy-ui/transpiled/react/IconButton'

import { useShareModal } from '../providers/ShareModalProvider'

const SharingButton = ({ className, file, variant }) => {
  const { setShowShareModal } = useShareModal()

  if (variant === 'iconButton')
    return (
      <IconButton className="u-white" onClick={() => setShowShareModal(true)}>
        <Icon icon={Share} />
      </IconButton>
    )

  return (
    <ShareButton
      className={className}
      fullWidth
      useShortLabel
      docId={file.id}
      onClick={() => setShowShareModal(true)}
    />
  )
}

SharingButton.propTypes = {
  file: PropTypes.object,
  variant: PropTypes.oneOf(['default', 'iconButton'])
}

SharingButton.defaultProptypes = {
  variant: 'default'
}

export default SharingButton
