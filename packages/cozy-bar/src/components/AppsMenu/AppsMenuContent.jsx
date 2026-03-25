import React from 'react'
import PropTypes from 'prop-types'

import flag from 'cozy-flags'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { sortApplicationsList } from 'cozy-client/dist/models/applications'

import AppItem from 'components/AppsMenu/components/AppItem'
import ShortcutItem from 'components/AppsMenu/components/ShortcutItem'
import EntrypointItem from 'components/AppsMenu/components/EntrypointItem'
import AppItemPlaceholder from 'components/AppsMenu/components/AppItemPlaceholder'
import useI18n from 'components/useI18n'
import styles from 'styles/apps-menu.styl'
import { getEntrypoints } from 'components/AppsMenu/helper'

const AppsMenuContent = ({
  isFetchingApps,
  apps,
  shortcuts,
  homeApp,
  closeMenu
}) => {
  const { t } = useI18n()

  if (!isFetchingApps && (!apps || !apps.length)) {
    return (
      <Typography className="u-mh-half" color="error">
        {t('no_apps')}
      </Typography>
    )
  }

  if (isFetchingApps) {
    return (
      <div className={styles['apps-menu-grid']}>
        <AppItemPlaceholder key="1" />
        <AppItemPlaceholder key="2" />
        <AppItemPlaceholder key="3" />
      </div>
    )
  }

  const homeSlug = homeApp && homeApp.slug

  const displayedApps = apps.filter(app => app.slug !== homeSlug)

  const sortedApps = flag('apps.sort')
    ? sortApplicationsList(displayedApps, flag('apps.sort'))
    : displayedApps

  const entrypoints = getEntrypoints(apps)

  return (
    <div className={styles['apps-menu-grid']}>
      {sortedApps.map(app => (
        <AppItem key={app.slug} app={app} onAppSwitch={closeMenu} />
      ))}
      {shortcuts.map((shortcut, index) => (
        <ShortcutItem key={index} shortcut={shortcut} />
      ))}
      {entrypoints.map(entrypoint => (
        <EntrypointItem key={entrypoint.name} entrypoint={entrypoint} />
      ))}
    </div>
  )
}

AppsMenuContent.propTypes = {
  isFetchingApps: PropTypes.bool.isRequired,
  apps: PropTypes.array,
  homeApp: PropTypes.shape({
    isCurrentApp: PropTypes.bool,
    slug: PropTypes.string,
    href: PropTypes.string
  }),
  closeMenu: PropTypes.func
}

export default AppsMenuContent
