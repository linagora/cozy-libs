import AppsMenu from 'components/AppsMenu'
import UserMenu from 'components/UserMenu'
import HelpLink from 'components/utils/HelpLink'
import React from 'react'

import { useFetchHomeShortcuts } from 'cozy-client'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

const TwakeRight = ({
  apps,
  appSlug,
  homeApp,
  barSearch,
  componentsProps,
  isFetchingApps,
  isSettingsAppInstalled,
  onLogOut
}) => {
  const { isMobile } = useBreakpoints()
  const shortcuts = useFetchHomeShortcuts()

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
        {...componentsProps?.UserMenu}
        onLogOut={onLogOut}
        isSettingsAppInstalled={isSettingsAppInstalled}
      />
    </>
  )
}

export default TwakeRight
