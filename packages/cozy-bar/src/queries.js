import CozyClient, { Q } from 'cozy-client'

const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(60 * 60 * 1000)

export const buildAppsQuery = () => ({
  definition: () => Q('io.cozy.apps'),
  options: {
    as: `io.cozy.apps`,
    fetchPolicy: defaultFetchPolicy
  }
})
