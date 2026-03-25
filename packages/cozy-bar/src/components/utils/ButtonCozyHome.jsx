import IconCozyHome from 'components/utils/IconCozyHome'
import PropTypes from 'prop-types'
import React from 'react'

import { isFlagshipApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import { useWebviewIntent } from 'cozy-intent'

const ButtonCozyHome = ({ homeHref, isInvertedTheme }) => {
  const webviewIntent = useWebviewIntent()

  if (isFlagshipApp() || flag('flagship.debug'))
    return (
      <a
        onClick={() => {
          webviewIntent.call('backToHome')
        }}
        className="coz-nav-apps-btns-home coz-nav-apps-btns-home--is-flagship"
        data-testid="buttonCozyHome"
      >
        <IconCozyHome
          className="coz-nav-apps-btns-home-svg"
          isInvertedTheme={isInvertedTheme}
        />
      </a>
    )

  if (homeHref) {
    return (
      <a
        href={homeHref}
        className="coz-nav-apps-btns-home"
        data-testid="buttonCozyHome"
      >
        <IconCozyHome
          className="coz-nav-apps-btns-home-svg"
          isInvertedTheme={isInvertedTheme}
        />
      </a>
    )
  }

  return (
    <span className="coz-nav-apps-btns-home" data-testid="buttonCozyHome">
      <IconCozyHome
        className="coz-nav-apps-btns-home-svg"
        isInvertedTheme={isInvertedTheme}
      />
    </span>
  )
}

ButtonCozyHome.propTypes = {
  homeHref: PropTypes.string,
  isInvertedTheme: PropTypes.bool
}

export default ButtonCozyHome
