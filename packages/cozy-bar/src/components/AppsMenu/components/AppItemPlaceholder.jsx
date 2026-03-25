import React from 'react'

import Skeleton from 'cozy-ui/transpiled/react/Skeleton'

export const AppItemPlaceholder = () => {
  return (
    <Skeleton
      variant="rect"
      width={48}
      height={48}
      className="u-m-1 u-bdrs-5"
    />
  )
}

export default AppItemPlaceholder
