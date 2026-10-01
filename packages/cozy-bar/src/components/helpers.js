import { getUrl } from 'cozy-client/dist/models/applications'
import flag from 'cozy-flags'

const mapApp = app => ({
  ...app,
  href: getUrl(app) || app.href
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
