import React from 'react'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import Icon from 'cozy-ui/transpiled/react/Icon'
import TwakeWorkplaceIcon from 'cozy-ui/transpiled/react/Icons/TwakeWorkplace'

const IconCozyHome = () => {
  const { isMobile } = useBreakpoints()

  return (
    <Icon
      icon={TwakeWorkplaceIcon}
      size={isMobile ? 28 : 32}
      className={isMobile ? 'u-ml-half' : undefined}
    />
  )
}

export default IconCozyHome
