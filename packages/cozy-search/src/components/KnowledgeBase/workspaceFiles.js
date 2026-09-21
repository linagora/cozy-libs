import { useEffect, useState } from 'react'

import { useClient } from 'cozy-client'
import Minilog from 'cozy-minilog'

const log = Minilog('[workspaceFiles]')

/**
 * Fetches how many files openRAG holds for a knowledge base folder: the
 * files attached to its workspace, indexed or still being indexed.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @param {string} dirId - The id of the knowledge base folder.
 * @returns {Promise<number|null>} The count, or null when the folder has
 * no workspace yet (the rag-index worker has not reconciled it).
 */
export const fetchWorkspaceFileCount = async (client, dirId) => {
  try {
    const { data } = await client.stackClient.fetchJSON(
      'GET',
      `/ai/workspaces/${encodeURIComponent(dirId)}/files`
    )
    return data?.attributes?.file_count ?? 0
  } catch (error) {
    if (error?.status === 404) return null
    throw error
  }
}

/**
 * Resolves the number of files openRAG holds for a knowledge base folder,
 * fetched again each time `dirId` changes. A null `dirId` disables the
 * fetch: pass one only while the count is displayed, so it stays fresh
 * while the indexing goes on.
 * @param {string|null} dirId - The id of the knowledge base folder.
 * @returns {{ fileCount: number|null, fetchStatus: 'pending'|'loading'|'loaded'|'failed' }}
 * `fileCount` is null until loaded, and stays null once loaded when the
 * folder has no workspace yet.
 */
export const useWorkspaceFileCount = dirId => {
  const client = useClient()
  // The result is stamped with the folder it is about: one about another
  // folder is stale, and the fetch of the current one is still running.
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!dirId) return
    let cancelled = false
    const load = async () => {
      try {
        const fileCount = await fetchWorkspaceFileCount(client, dirId)
        if (!cancelled) setResult({ dirId, fileCount, fetchStatus: 'loaded' })
      } catch (error) {
        log.warn('cannot fetch the workspace files of folder', dirId, error)
        if (!cancelled) {
          setResult({ dirId, fileCount: null, fetchStatus: 'failed' })
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [client, dirId])

  if (!dirId) return { fileCount: null, fetchStatus: 'pending' }
  if (result?.dirId !== dirId)
    return { fileCount: null, fetchStatus: 'loading' }
  return { fileCount: result.fileCount, fetchStatus: result.fetchStatus }
}
