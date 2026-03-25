import React from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Icon from 'cozy-ui/transpiled/react/Icon'
import HelpOutlinedIcon from 'cozy-ui/transpiled/react/Icons/HelpOutlined'

import { useInstanceInfo } from 'cozy-client'

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
