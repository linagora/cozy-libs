import PropTypes from 'prop-types'
import React, { useState } from 'react'

import flag from 'cozy-flags'

import { ShareRestrictionModal } from './ShareRestrictionModal'

export const AutoOpenShareRestriction = ({ file, link }) => {
  const [isOpen, setIsOpen] = useState(
    () => flag('sharing.auto-open-settings.enabled') && !link
  )

  if (!isOpen) return null

  return <ShareRestrictionModal file={file} onClose={() => setIsOpen(false)} />
}

AutoOpenShareRestriction.propTypes = {
  file: PropTypes.object.isRequired,
  link: PropTypes.string
}
