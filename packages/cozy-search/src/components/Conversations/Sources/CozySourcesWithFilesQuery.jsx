import React from 'react'

import { useClient, useQuery, isQueryLoading } from 'cozy-client'

import { Sources } from './Sources'
import { getDriveMimeTypeIcon } from '../../Search/getIconForSearchResult'
import { makeEmailUrl, makeFileUrl } from '../../cozyWebLinks'
import { EMAIL_DOCTYPE, buildFilesByIds } from '../../queries'

const WEB_SOURCE_TYPE = 'web'

/**
 * Cozy adapter for the `SourcesRenderer` seam: fetches the file documents and
 * resolves everything backend-specific (Twake web links, mime-type icons)
 * before handing plain data to the presentational `Sources`.
 */
const CozySourcesWithFilesQuery = ({ messageId, sources = [] }) => {
  const client = useClient()
  const fileIds = []
  const emails = []
  const urls = []
  sources.forEach(source => {
    if (source.sourceType === WEB_SOURCE_TYPE) urls.push(source)
    else if (source.doctype === EMAIL_DOCTYPE) emails.push(source)
    else fileIds.push(source.id)
  })
  const enabled = fileIds.length > 0
  const filesByIds = buildFilesByIds(fileIds, enabled)
  const { data: fetchedFiles, ...queryResult } = useQuery(
    filesByIds.definition,
    filesByIds.options
  )
  const isLoading = isQueryLoading(queryResult)
  const files = fetchedFiles || []

  if (
    (isLoading && enabled) ||
    (files.length === 0 && emails.length === 0 && urls.length === 0)
  )
    return null

  return (
    <Sources
      messageId={messageId}
      files={files.map(file => ({
        ...file,
        url: makeFileUrl(client, file),
        icon: getDriveMimeTypeIcon(file)
      }))}
      emails={emails.map(email => ({
        ...email,
        url: makeEmailUrl(client, email)
      }))}
      urls={urls}
    />
  )
}

export default CozySourcesWithFilesQuery
