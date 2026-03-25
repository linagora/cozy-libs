import { models } from 'cozy-client'

const {
  applications: { selectEntrypoints, filterEntrypoints }
} = models

// We get only the entrypoints we want:
// - Drive onlyoffice
export const getEntrypoints = apps => {
  const driveApp = apps.find(app => app.slug === 'drive') || {}

  const driveEntrypoints = driveApp.entrypoints || []

  const selectedEntrypoints = selectEntrypoints(driveEntrypoints, [
    'new-file-type-text',
    'new-file-type-sheet',
    'new-file-type-slide'
  ])
  const filteredEntrypoints = filterEntrypoints(selectedEntrypoints)

  return filteredEntrypoints.map(entrypoint => ({
    ...entrypoint,
    slug: driveApp.slug
  }))
}
