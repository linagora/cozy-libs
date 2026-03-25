import React from 'react'

import { useInstanceInfo } from 'cozy-client'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import HelpOutlinedIcon from 'cozy-ui/transpiled/react/Icons/HelpOutlined'

const HelpLink = () => {
  const { context } = useInstanceInfo()
  const helpLink = context.data?.attributes?.help_link || null

  if (!helpLink) return null

  return (
    <IconButton
      component="a"
      href={helpLink}
      target="_blank"
      rel="noopener, noreferrer"
      className="u-p-half"
    >
      <Icon icon={HelpOutlinedIcon} size="18" />
    </IconButton>
  )
}

export default HelpLink
