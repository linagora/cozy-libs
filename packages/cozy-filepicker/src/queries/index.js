import CozyClient, { Q } from 'cozy-client'

const DEFAULT_CACHE_TIMEOUT_QUERIES = 9 * 60 * 1000 // 10 minutes
const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(
  DEFAULT_CACHE_TIMEOUT_QUERIES
)

export const buildFilesQuery = () => ({
  definition: () =>
    Q('io.cozy.files').where({
      dir_id: {
        $ne: 'io.cozy.files.trash-dir'
      }
    }),
  options: {
    as: 'io.cozy.files/picker/*',
    fetchPolicy: defaultFetchPolicy
  }
})
