import cx from 'classnames'
import AppsMenu from 'components/AppsMenu'
import Banner from 'components/Banner'
import UserMenu from 'components/UserMenu'
import { getAppsData } from 'components/helpers'
import ButtonCozyHome from 'components/utils/ButtonCozyHome'
import HelpLink from 'components/utils/HelpLink'
import SearchButton from 'components/utils/SearchButton'
import PropTypes from 'prop-types'
import { buildAppsQuery } from 'queries'
import React, { useMemo } from 'react'

import { useFetchHomeShortcuts, useQuery, RealTimeQueries } from 'cozy-client'
import { isFlagshipApp } from 'cozy-device-helper'
import flag from 'cozy-flags'
import { AssistantDesktop } from 'cozy-search'
import AppTitle from 'cozy-ui/transpiled/react/AppTitle'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Grid from 'cozy-ui/transpiled/react/Grid'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

export const Bar = ({
  isPublic,
  barLeft,
  barRight,
  barCenter,
  barSearch,
  onLogOut,
  userActionRequired,
  appIcon,
  appTextIcon,
  searchOptions,
  isInvertedTheme,
  appSlug,
  componentsProps
}) => {
  const { isMobile } = useBreakpoints()
  const shortcuts = useFetchHomeShortcuts()

  const appsQuery = buildAppsQuery()
  const appsResult = useQuery(appsQuery.definition, {
    ...appsQuery.options,
    enabled: !isPublic
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rawApps = appsResult.data || []
  const isFetchingApps = appsResult.fetchStatus === 'loading'

  const { apps, homeApp, isSettingsAppInstalled } = useMemo(
    () => getAppsData(rawApps, appSlug),
    [rawApps, appSlug]
  )

  const isSearchEnabled = searchOptions.enabled && !isPublic

  const renderCenter = () => {
    return null
  }

  const renderLeft = () => {
    if (isFlagshipApp() || flag('flagship.debug')) {
      return <ButtonCozyHome isInvertedTheme={isInvertedTheme} />
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

  const renderTwakeRight = () => {
    // Special case because search on Drive on mobile still rely
    // on old search UI that is injected in the cozy-bar and
    // not in a modal as the new search UI
    // So we need to hide these menu buttons when old search UI
    // is injected in the cozy-bar
    // When https://github.com/cozy/cozy-drive/pull/3320 will be merged
    // Drive will rely on cozy-bar embedded search and we will be able
    // to remove this special case
    if (appSlug === 'drive' && isMobile && barSearch) return null

    return (
      <>
        <HelpLink />
        <AppsMenu
          apps={apps}
          homeApp={homeApp}
          isFetchingApps={isFetchingApps}
          shortcuts={shortcuts}
        />
        <UserMenu
          onLogOut={onLogOut}
          isSettingsAppInstalled={isSettingsAppInstalled}
        />
      </>
    )
  }

  const renderSearch = () => {
    return isSearchEnabled && !isMobile ? (
      <div className="u-flex-grow u-mh-2">
        <AssistantDesktop
          componentsProps={{ SearchBarDesktop: { size: 'small' } }}
        />
      </div>
    ) : null
  }

  return (
    <div
      {...componentsProps?.Wrapper}
      className={cx('coz-bar-wrapper', componentsProps?.Wrapper?.className)}
      data-testid="coz-bar-wrapper"
    >
      {!isPublic && <RealTimeQueries doctype="io.cozy.apps" />}
      <div id="cozy-bar-modal-dom-place" />
      <div className="coz-bar-container">
        {barLeft || renderLeft()}
        {barCenter || renderCenter()}
        <div className="u-flex-grow">{barSearch || renderSearch()}</div>
        {isSearchEnabled && isMobile ? <SearchButton /> : null}
        {barRight}
        {!isPublic && renderTwakeRight()}
      </div>
      {userActionRequired && <Banner {...userActionRequired} />}
    </div>
  )
}

Bar.propTypes = {
  appSlug: PropTypes.string,
  isPublic: PropTypes.bool,
  isInvertedTheme: PropTypes.bool,
  onLogOut: PropTypes.func,
  userActionRequired: PropTypes.object,
  componentsProps: PropTypes.shape({
    Wrapper: PropTypes.shape({
      className: PropTypes.string
    })
  })
}

export default Bar
