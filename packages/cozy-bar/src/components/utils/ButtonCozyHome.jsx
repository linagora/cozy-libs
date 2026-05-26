import IconCozyHome from 'components/utils/IconCozyHome'
import PropTypes from 'prop-types'
import React from 'react'

import { isFlagshipApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import { useWebviewIntent } from 'cozy-intent'

const ButtonCozyHome = ({ homeHref }) => {
  const webviewIntent = useWebviewIntent()

  if (isFlagshipApp() || flag('flagship.debug'))
    return (
      <a
        onClick={() => {
          webviewIntent.call('backToHome')
        }}
        className="coz-nav-apps-btns-home"
        data-testid="buttonCozyHome"
      >
        <IconCozyHome />
      </a>
    )

  if (homeHref) {
    return (
      <a
        href={homeHref}
        className="coz-nav-apps-btns-home"
        data-testid="buttonCozyHome"
      >
        <IconCozyHome />
      </a>
    )
  }

  return (
    <span className="coz-nav-apps-btns-home" data-testid="buttonCozyHome">
      <IconCozyHome />
    </span>
  )
}

ButtonCozyHome.propTypes = {
  homeHref: PropTypes.string
}

export default ButtonCozyHome
