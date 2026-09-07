import uniqBy from 'lodash/uniqBy'
import React, { useState, useRef, useEffect } from 'react'

import { Icon, MultiFiles, Right } from '@linagora/twake-icons'
import { useQuery, isQueryLoading } from 'cozy-client'
import Box from 'cozy-ui/transpiled/react/Box'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Grow from 'cozy-ui/transpiled/react/Grow'
import { useI18n } from 'twake-i18n'

import EmailSourceItem from './EmailSourceItem'
import FileSourcesItem from './FileSourcesItem'
import WebSourceItem from './WebSourceItem'
import { EMAIL_DOCTYPE, FILES_DOCTYPE, buildFilesByIds } from '../../queries'

const WEB_SOURCE_TYPE = 'web'

// Web sources have no doctype, other sources are identified by theirs
const getSourceType = source => {
  if (source.sourceType === WEB_SOURCE_TYPE) return WEB_SOURCE_TYPE
  if (source.doctype === EMAIL_DOCTYPE) return EMAIL_DOCTYPE
  return FILES_DOCTYPE
}

const getSourceKey = source => {
  const type = getSourceType(source)
  const identity = type === WEB_SOURCE_TYPE ? source.url : source.id
  return identity ? `${type}:${identity}` : null
}

/**
 * A same document can be returned several times by the RAG, typically when
 * several chunks of the same file or email are relevant. We only want to
 * display it once. Sources without any identity are all kept, as we can't
 * tell them apart.
 */
const dedupeSources = sources =>
  uniqBy(sources, source => getSourceKey(source) ?? source)

const Sources = ({ messageId, files, emails, urls }) => {
  const [showSources, setShowSources] = useState(false)
  const { t } = useI18n()
  const ref = useRef()

  const handleShowSources = () => {
    setShowSources(v => !v)
  }

  // we want to scroll down to the sources button when it is displayed
  useEffect(() => {
    ref.current?.scrollIntoView(false)
  }, [])

  useEffect(() => {
    if (showSources) {
      const innerContainer = ref.current?.closest('.cozyDialogContent')
      if (!innerContainer) {
        ref.current?.scrollIntoView(false)
        return
      }
      const sourcesBottom = ref.current.getBoundingClientRect().bottom
      const innerContainerBottom = innerContainer.getBoundingClientRect().bottom
      if (sourcesBottom > innerContainerBottom) {
        ref.current.scrollIntoView(false)
      }
    }
  }, [showSources])

  return (
    <Box ref={ref} className="u-mt-1-half">
      <Chip
        className="u-mb-1"
        icon={<Icon icon={MultiFiles} className="u-ml-half" />}
        label={t(
          'assistant.sources',
          files.length + emails.length + urls.length
        )}
        deleteIcon={
          <Icon className="u-h-1" icon={Right} rotate={showSources ? 90 : 0} />
        }
        clickable
        onClick={handleShowSources}
        onDelete={handleShowSources}
      />
      <Grow
        in={showSources}
        style={{ transformOrigin: '0 0 0' }}
        mountOnEnter={true}
        unmountOnExit={true}
      >
        <div>
          {files.map(file => (
            <FileSourcesItem key={`${messageId}-${file._id}`} file={file} />
          ))}
          {emails.map(email => (
            <EmailSourceItem key={`${messageId}-${email.id}`} email={email} />
          ))}
          {urls?.map((url, index) => (
            <WebSourceItem
              key={`${messageId}-${url.url || index}`}
              source={url}
            />
          ))}
        </div>
      </Grow>
    </Box>
  )
}

const SourcesWithFilesQuery = ({ messageId, sources }) => {
  const fileIds = []
  const emails = []
  const urls = []
  dedupeSources(sources).forEach(source => {
    const type = getSourceType(source)
    if (type === WEB_SOURCE_TYPE) {
      urls.push(source)
    } else if (type === EMAIL_DOCTYPE) {
      emails.push(source)
    } else {
      fileIds.push(source.id)
    }
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
    <Sources messageId={messageId} files={files} emails={emails} urls={urls} />
  )
}

export default SourcesWithFilesQuery
