import React from 'react'

import { useClient } from 'cozy-client'
import TwakeWorkplaceIcon from 'cozy-ui/transpiled/react/Icons/TwakeWorkplace'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import AppIcon from 'cozy-ui-plus/dist/AppIcon'

const IconCozyHome = () => {
  const { isMobile } = useBreakpoints()
  const client = useClient()

  const fetchIcon = () => {
    return `${client.getStackClient().uri}/assets/images/icon-cozy-home.svg`
  }

  return (
    <AppIcon
      fetchIcon={fetchIcon}
      fallbackIcon={TwakeWorkplaceIcon}
      className={isMobile ? 'u-ml-half' : undefined}
    />
  )
}

export default IconCozyHome
