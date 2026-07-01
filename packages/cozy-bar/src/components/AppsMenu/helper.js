import { models } from 'cozy-client'

const {
  applications: { filterEntrypoints }
} = models

export const getEntrypoints = apps => {
  return (apps || []).flatMap(app =>
    filterEntrypoints(app.entrypoints || []).map(entrypoint => ({
      ...entrypoint,
      slug: app.slug
    }))
  )
}
