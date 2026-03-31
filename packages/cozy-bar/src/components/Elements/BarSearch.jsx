import React from 'react'

import { AssistantDesktop } from 'cozy-search'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

const BarSearch = ({ isSearchEnabled }) => {
  const { isMobile } = useBreakpoints()

  if (isSearchEnabled && !isMobile) {
    return (
      <div className="u-flex-grow u-mh-2">
        <AssistantDesktop
          componentsProps={{ SearchBarDesktop: { size: 'small' } }}
        />
      </div>
    )
  }

  return null
}

export default BarSearch
