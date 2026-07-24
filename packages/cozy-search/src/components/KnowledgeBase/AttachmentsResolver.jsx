import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { RealTimeQueries, useQuery, useQueryAll } from 'cozy-client'

import { collectAttachmentsResolution, getDocId } from './attachments'
import { useAssistant } from '../AssistantProvider'
import { buildFilesByDirIdQuery, buildFilesByIds } from '../queries'

/**
 * Classic named query per directory: cached 5 minutes by fetch policy and
 * kept fresh in the Redux store by RealTimeQueries, so re-renders stay cheap.
 */
const DirWatcher = ({ dirId, onResult }) => {
  const query = buildFilesByDirIdQuery(dirId)
  const { data, fetchStatus, hasMore } = useQueryAll(
    query.definition,
    query.options
  )

  useEffect(() => {
    onResult(dirId, { data, fetchStatus, hasMore })
  }, [dirId, data, fetchStatus, hasMore, onResult])

  return null
}

/**
 * Renderless resolver for the default assistant's Drive restriction: expands
 * the picked selection into the flat list of file ids sent as
 * `attachmentIDs`, walking folders level by level (one DirWatcher per
 * directory — React mounts the next level's watchers as subfolders are
 * discovered, so each level's queries run in parallel). The result is
 * published into AssistantProvider, keyed by conversation.
 */
const AttachmentsResolver = ({ conversationId, selectedDocs }) => {
  const { setAttachmentsResolution } = useAssistant()
  const [resultsByDirId, setResultsByDirId] = useState({})

  const onResult = useCallback((dirId, result) => {
    setResultsByDirId(prev => {
      const previous = prev[dirId]
      if (
        previous &&
        previous.data === result.data &&
        previous.fetchStatus === result.fetchStatus &&
        previous.hasMore === result.hasMore
      ) {
        return prev
      }
      return { ...prev, [dirId]: result }
    })
  }, [])

  // Watch the picked docs themselves (rename, trash, deletion)
  const pickedIds = useMemo(() => selectedDocs.map(getDocId), [selectedDocs])
  const pickedQuery = buildFilesByIds(pickedIds, pickedIds.length > 0)
  const { data: pickedDocs, fetchStatus: pickedFetchStatus } = useQuery(
    pickedQuery.definition,
    pickedQuery.options
  )

  const resolution = useMemo(
    () =>
      collectAttachmentsResolution({
        selectedDocs,
        pickedDocs,
        pickedFetchStatus,
        resultsByDirId
      }),
    [selectedDocs, pickedDocs, pickedFetchStatus, resultsByDirId]
  )

  // Publish by value: the provider state must only change when the resolved
  // content changes, or the adapter would be pointlessly recreated.
  const { dirIds } = resolution
  const serializedResolution = JSON.stringify({
    attachmentIds: resolution.attachmentIds,
    isOverLimit: resolution.isOverLimit,
    isLoading: resolution.isLoading,
    isUnavailable: resolution.isUnavailable
  })

  useEffect(() => {
    setAttachmentsResolution(conversationId, JSON.parse(serializedResolution))
  }, [conversationId, serializedResolution, setAttachmentsResolution])

  useEffect(() => {
    return () => setAttachmentsResolution(conversationId, null)
  }, [conversationId, setAttachmentsResolution])

  return (
    <>
      <RealTimeQueries doctype="io.cozy.files" />
      {dirIds.map(dirId => (
        <DirWatcher key={dirId} dirId={dirId} onResult={onResult} />
      ))}
    </>
  )
}

export default AttachmentsResolver
