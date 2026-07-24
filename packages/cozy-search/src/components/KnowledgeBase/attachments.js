export const ATTACHMENTS_MAX_FILES = 1000

/**
 * Docs returned by the Drive PICK intent carry `id`; docs from the
 * cozy-client store carry `_id`. Normalize every access through this.
 */
export const getDocId = doc => doc?._id ?? doc?.id

const isTrashed = doc =>
  !!doc?.trashed || !!doc?.path?.startsWith('/.cozy_trash')

/**
 * Expands the picked selection (files and/or folders) into the flat list of
 * file ids to send as `attachmentIDs`, walking folders level by level from
 * per-directory query results.
 *
 * @param {object} params
 * @param {Array<object>} params.selectedDocs - docs picked in the file picker
 * @param {Array<object>|undefined} params.pickedDocs - live versions of the
 *   picked docs (from a byIds query); deleted docs are simply absent
 * @param {string} params.pickedFetchStatus - fetchStatus of the byIds query
 * @param {Object<string, {data: Array<object>|undefined, fetchStatus: string,
 *   hasMore: boolean|undefined}>} params.resultsByDirId - one entry per
 *   watched directory (`useQueryAll` result)
 * @returns {{dirIds: string[], attachmentIds: string[], isOverLimit: boolean,
 *   isLoading: boolean, isUnavailable: boolean, isEmpty: boolean}} `dirIds`
 *   is the closure of directories to watch (roots + discovered subfolders,
 *   BFS order); traversal stops enqueueing new directories once the file
 *   count exceeds the cap, so `dirIds` may be a strict subset of the full
 *   tree while `isOverLimit` is true
 */
export const collectAttachmentsResolution = ({
  selectedDocs,
  pickedDocs,
  pickedFetchStatus,
  resultsByDirId
}) => {
  const pickedLoaded = pickedFetchStatus === 'loaded'
  const pickedById = new Map(
    (pickedDocs ?? []).map(doc => [getDocId(doc), doc])
  )

  const liveSelected = selectedDocs
    .map(doc => pickedById.get(getDocId(doc)))
    .filter(doc => !!doc && !isTrashed(doc))
  const isUnavailable =
    pickedLoaded && liveSelected.length < selectedDocs.length

  const dirIds = []
  const seenDirIds = new Set()
  const enqueueDir = id => {
    if (id && !seenDirIds.has(id)) {
      seenDirIds.add(id)
      dirIds.push(id)
    }
  }

  const fileIds = new Set()
  for (const doc of liveSelected) {
    if (doc.type === 'directory') enqueueDir(getDocId(doc))
    else if (doc.type === 'file') fileIds.add(getDocId(doc))
  }

  let isLoading = !pickedLoaded
  for (let i = 0; i < dirIds.length; i++) {
    const result = resultsByDirId[dirIds[i]]
    if (!result || result.fetchStatus !== 'loaded' || result.hasMore) {
      isLoading = true
      continue
    }
    for (const child of result.data ?? []) {
      if (child.type === 'directory') {
        // Once over the cap the exact tree shape no longer matters (sending
        // is already blocked): stop growing the BFS queue so the resolver
        // doesn't mount a DirWatcher (Mango query) per remaining directory.
        if (fileIds.size <= ATTACHMENTS_MAX_FILES) enqueueDir(getDocId(child))
      } else if (child.type === 'file' && !isTrashed(child)) {
        fileIds.add(getDocId(child))
      }
    }
  }

  const isOverLimit = fileIds.size > ATTACHMENTS_MAX_FILES
  const isEmpty =
    selectedDocs.length > 0 &&
    !isLoading &&
    !isUnavailable &&
    fileIds.size === 0

  return {
    dirIds,
    attachmentIds: [...fileIds].slice(0, ATTACHMENTS_MAX_FILES),
    isOverLimit,
    isLoading,
    isUnavailable,
    isEmpty
  }
}

/**
 * A restriction must never silently degrade to an unrestricted search:
 * while the selection is loading, over the limit, unavailable or resolves to
 * zero files, sending is blocked.
 */
export const isAttachmentsBlocked = (selection, resolution) => {
  if (!selection || selection.length === 0) return false
  if (!resolution) return true
  return (
    resolution.isLoading ||
    resolution.isOverLimit ||
    resolution.isUnavailable ||
    resolution.isEmpty
  )
}
