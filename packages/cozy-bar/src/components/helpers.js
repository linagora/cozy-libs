import flag from 'cozy-flags'

// cozy-client's useQuery normalizes JSON:API responses — attributes are
// spread to the top level (e.g. app.slug, app.name exist directly).
// We only ensure `href` is derived from `links.related` for AppLinker.
const mapApp = app => ({
  ...app,
  href: (app.links && app.links.related) || app.href
})

export const getAppsData = (rawApps, appSlug) => {
  const excludedApps = flag('apps.hidden') || []

  const apps = rawApps
    .map(mapApp)
    .filter(app => !excludedApps.includes(app.slug))
    .map(app => ({
      ...app,
      isCurrentApp: app.slug === appSlug
    }))

  const homeApp = apps.find(app => app.slug === 'home') || null

  const isSettingsAppInstalled = rawApps.some(app => app.slug === 'settings')

  return { apps, homeApp, isSettingsAppInstalled }
}
