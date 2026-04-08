import React, { useState, useRef, useEffect } from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import Box from 'cozy-ui/transpiled/react/Box'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Grow from 'cozy-ui/transpiled/react/Grow'
import Icon from 'cozy-ui/transpiled/react/Icon'
import MultiFilesIcon from 'cozy-ui/transpiled/react/Icons/MultiFiles'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import { useI18n } from 'twake-i18n'

import EmailSourceItem from './EmailSourceItem'
import FileSourcesItem from './FileSourcesItem'
import WebSourceItem from './WebSourceItem'
import { EMAIL_DOCTYPE, buildFilesByIds } from '../../queries'

const WEB_SOURCE_TYPE = 'web'

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
    <Box ref={ref} className="u-mt-1-half" pl="44px">
      <Chip
        className="u-mb-1"
        icon={<Icon icon={MultiFilesIcon} className="u-ml-half" />}
        label={t(
          'assistant.sources',
          files.length + emails.length + urls.length
        )}
        deleteIcon={
          <Icon
            className="u-h-1"
            icon={RightIcon}
            rotate={showSources ? 90 : 0}
          />
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
  let files
  sources.map(source => {
    if (source.sourceType === WEB_SOURCE_TYPE) {
      urls.push(source)
    } else if (source.doctype === EMAIL_DOCTYPE) {
      emails.push(source)
    } else {
      fileIds.push(source.id)
    }
  })
  const enabled = fileIds && fileIds.length > 0
  const filesByIds = buildFilesByIds(fileIds, enabled)
  const { data: fetchedFiles, ...queryResult } = useQuery(
    filesByIds.definition,
    filesByIds.options
  )

  const isLoading = isQueryLoading(queryResult)
  files = fetchedFiles || []

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
