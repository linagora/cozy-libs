import { TwakeWorkplace } from '@linagora/twake-icons'
import React, { useCallback } from 'react'

import { useClient } from 'cozy-client'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import AppIcon from 'cozy-ui-plus/dist/AppIcon'

const IconCozyHome = () => {
  const { isMobile } = useBreakpoints()
  const client = useClient()

  // AppIcon reloads the icon whenever fetchIcon changes
  const fetchIcon = useCallback(
    () => `${client.getStackClient().uri}/assets/images/icon-cozy-home.svg`,
    [client]
  )

  return (
    <AppIcon
      fetchIcon={fetchIcon}
      fallbackIcon={TwakeWorkplace}
      className={isMobile ? 'u-ml-half' : undefined}
    />
  )
}

export default IconCozyHome
