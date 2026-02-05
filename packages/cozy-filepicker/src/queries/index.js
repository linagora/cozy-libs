import CozyClient, { Q } from 'cozy-client'

const DEFAULT_CACHE_TIMEOUT_QUERIES = 9 * 60 * 1000 // 10 minutes
const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(
  DEFAULT_CACHE_TIMEOUT_QUERIES
)

export const buildFilesQuery = () => ({
  definition: () => Q('io.cozy.files'),
  options: {
    as: 'io.cozy.files/*',
    fetchPolicy: defaultFetchPolicy
  }
})
