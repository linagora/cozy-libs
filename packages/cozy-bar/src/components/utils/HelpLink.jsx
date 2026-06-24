import { Icon, HelpOutlined } from '@linagora/twake-icons'
import React from 'react'

import { useInstanceInfo } from 'cozy-client'
import IconButton from 'cozy-ui/transpiled/react/IconButton'

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
      <Icon icon={HelpOutlined} size="18" />
    </IconButton>
  )
}

export default HelpLink
