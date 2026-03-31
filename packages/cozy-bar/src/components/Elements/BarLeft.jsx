import ButtonCozyHome from 'components/utils/ButtonCozyHome'
import React from 'react'

import { isFlagshipApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import AppTitle from 'cozy-ui/transpiled/react/AppTitle'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Grid from 'cozy-ui/transpiled/react/Grid'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

const BarLeft = ({ isPublic, homeApp, appSlug, appIcon, appTextIcon }) => {
  const { isMobile } = useBreakpoints()

  if (isFlagshipApp() || flag('flagship.debug')) {
    return <ButtonCozyHome />
  }

  const homeHref = !isPublic && homeApp && homeApp.href

  if (isMobile) {
    return <ButtonCozyHome homeHref={homeHref} />
  }

  const isHome = appSlug === 'home'

  return (
    <Grid container alignItems="center" className="u-w-auto">
      {!isHome && (
        <>
          <ButtonCozyHome homeHref={homeHref} />
          <Divider orientation="vertical" className="u-mr-half" flexItem />
        </>
      )}
      <AppTitle appIcon={appIcon} appTextIcon={appTextIcon} />
    </Grid>
  )
}

export default BarLeft
