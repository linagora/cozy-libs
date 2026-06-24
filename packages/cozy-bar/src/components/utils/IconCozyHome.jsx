import { TwakeWorkplace } from '@linagora/twake-icons'
import React from 'react'

import { useClient } from 'cozy-client'
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
      fallbackIcon={TwakeWorkplace}
      className={isMobile ? 'u-ml-half' : undefined}
    />
  )
}

export default IconCozyHome
