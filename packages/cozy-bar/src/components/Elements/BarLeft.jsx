import ButtonCozyHome from 'components/utils/ButtonCozyHome'
import React from 'react'

import { isFlagshipApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import AppTitle from 'cozy-ui/transpiled/react/AppTitle'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Grid from 'cozy-ui/transpiled/react/Grid'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

// The standalone bar receives icons as URLs instead of SVG components
const AppTitleOrIcon = ({ appName, appIcon, appTextIcon }) => {
  if (typeof appIcon !== 'string') {
    return <AppTitle appIcon={appIcon} appTextIcon={appTextIcon} />
  }
  if (typeof appTextIcon !== 'string') {
    return (
      <img src={appIcon} alt={appName ?? ''} className="coz-bar-app-icon" />
    )
  }
  return (
    <AppTitle
      appIcon={<img src={appIcon} alt="" className="coz-bar-app-icon" />}
      appTextIcon={
        <img
          src={appTextIcon}
          alt={appName ?? ''}
          className="coz-bar-app-text-icon"
        />
      }
    />
  )
}

const BarLeft = ({
  isPublic,
  homeApp,
  appName,
  appIcon,
  appTextIcon,
  noCozyHome
}) => {
  const { isMobile } = useBreakpoints()

  if (isFlagshipApp() || flag('flagship.debug')) {
    return <ButtonCozyHome />
  }

  const homeHref = !isPublic && homeApp && homeApp.href

  if (isMobile) {
    if (noCozyHome) {
      if (homeHref) {
        return (
          <a className="coz-nav-apps-btns-home u-ml-half" href={homeHref}>
            <AppTitleOrIcon
              appName={appName}
              appIcon={appIcon}
              appTextIcon={appTextIcon}
            />
          </a>
        )
      }
      return (
        <AppTitleOrIcon
          appName={appName}
          appIcon={appIcon}
          appTextIcon={appTextIcon}
        />
      )
    }
    return <ButtonCozyHome homeHref={homeHref} />
  }

  return (
    <Grid container alignItems="center" className="u-w-auto">
      {!noCozyHome && (
        <>
          <ButtonCozyHome homeHref={homeHref} />
          <Divider orientation="vertical" className="u-mr-half" flexItem />
        </>
      )}
      {noCozyHome && homeHref ? (
        <a className="coz-nav-apps-btns-home u-ml-half" href={homeHref}>
          <AppTitleOrIcon
            appName={appName}
            appIcon={appIcon}
            appTextIcon={appTextIcon}
          />
        </a>
      ) : (
        <AppTitleOrIcon
          appName={appName}
          appIcon={appIcon}
          appTextIcon={appTextIcon}
        />
      )}
    </Grid>
  )
}

export default BarLeft
