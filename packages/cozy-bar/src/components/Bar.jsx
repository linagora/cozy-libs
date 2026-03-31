import cx from 'classnames'
import Banner from 'components/Banner'
import BarLeft from 'components/Elements/BarLeft'
import BarSearch from 'components/Elements/BarSearch'
import TwakeRight from 'components/Elements/TwakeRight'
import { getAppsData } from 'components/helpers'
import SearchButton from 'components/utils/SearchButton'
import PropTypes from 'prop-types'
import { buildAppsQuery } from 'queries'
import React, { useMemo } from 'react'

import { useQuery, RealTimeQueries } from 'cozy-client'
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
  appSlug,
  componentsProps
}) => {
  const { isMobile } = useBreakpoints()

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

  return (
    <div
      {...componentsProps?.Wrapper}
      className={cx('coz-bar-wrapper', componentsProps?.Wrapper?.className)}
      data-testid="coz-bar-wrapper"
    >
      {!isPublic && <RealTimeQueries doctype="io.cozy.apps" />}
      <div id="cozy-bar-modal-dom-place" />
      <div className="coz-bar-container">
        {barLeft || (
          <BarLeft
            isPublic={isPublic}
            homeApp={homeApp}
            appSlug={appSlug}
            appIcon={appIcon}
            appTextIcon={appTextIcon}
          />
        )}
        {barCenter}
        <div className="u-flex-grow">
          {barSearch || <BarSearch isSearchEnabled={isSearchEnabled} />}
        </div>
        {isSearchEnabled && isMobile ? <SearchButton /> : null}
        {barRight}
        {!isPublic && (
          <TwakeRight
            apps={apps}
            appSlug={appSlug}
            homeApp={homeApp}
            barSearch={barSearch}
            isFetchingApps={isFetchingApps}
            isSettingsAppInstalled={isSettingsAppInstalled}
            onLogOut={onLogOut}
          />
        )}
      </div>
      {userActionRequired && <Banner {...userActionRequired} />}
    </div>
  )
}

Bar.propTypes = {
  appSlug: PropTypes.string,
  isPublic: PropTypes.bool,
  onLogOut: PropTypes.func,
  userActionRequired: PropTypes.object,
  componentsProps: PropTypes.shape({
    Wrapper: PropTypes.shape({
      className: PropTypes.string
    })
  })
}

export default Bar
