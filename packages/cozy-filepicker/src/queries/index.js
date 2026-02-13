import CozyClient, { Q } from 'cozy-client'

const DEFAULT_CACHE_TIMEOUT_QUERIES = 9 * 60 * 1000 // 10 minutes
const defaultFetchPolicy = CozyClient.fetchPolicies.olderThan(
  DEFAULT_CACHE_TIMEOUT_QUERIES
)

export const buildFilesQuery = directoryId => ({
  definition: () =>
    Q('io.cozy.files').where({
      dir_id: {
        $eq: directoryId
      },
      _id: {
        $ne: 'io.cozy.files.trash-dir'
      }
    }),
  options: {
    as: 'io.cozy.files/picker/' + directoryId,
    fetchPolicy: defaultFetchPolicy
  }
})

export const buildFileQuery = fileId => ({
  definition: () =>
    Q('io.cozy.files').where({
      _id: {
        $eq: fileId
      }
    }),
  options: {
    as: 'io.cozy.files/file/' + fileId,
    fetchPolicy: defaultFetchPolicy,
    singleDocData: true
  }
})
