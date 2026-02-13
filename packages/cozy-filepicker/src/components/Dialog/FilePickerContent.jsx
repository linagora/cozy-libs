import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from 'twake-i18n'

import { RealTimeQueries, useQuery } from 'cozy-client'
import Divider from 'cozy-ui/transpiled/react/Divider'
import List from 'cozy-ui/transpiled/react/List'
import { CircularProgress } from 'cozy-ui/transpiled/react/Progress'
import Typography from 'cozy-ui/transpiled/react/Typography'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { buildFilesQuery } from '../../queries'
import { useFilePicker } from '../FilePickerContext'
import FilePickerItem from '../Item/FilePickerItem'

const FilePickerContent = () => {
  const {
    directory,
    normalizedSearch: search,
    lastUploadedFileId,
    uploadFile
  } = useFilePicker()
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (lastUploadedFileId) {
      const element = document.getElementById(
        `file-picker-item-${lastUploadedFileId}`
      )
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [lastUploadedFileId, sortedFiles])

  const onDragOver = e => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = e => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const onDrop = async e => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await uploadFile(files)
    }
  }

  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const filesQuery = buildFilesQuery(search ? null : directory, search)
  const files = useQuery(filesQuery.definition, filesQuery.options)

  const sortedFiles = useMemo(() => {
    return files.data
      ? [...files.data].sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') {
          return -1
        }
        if (a.type !== 'directory' && b.type === 'directory') {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
      : []
  }, [files.data])

  return (
    <div
      className={isMobile ? 'u-h-100' : 'u-h-6'}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        overflowY: 'auto',
        position: 'relative',
        border: isDragOver
          ? '2px dashed var(--primaryColor)'
          : '2px solid transparent'
      }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={directory}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: { duration: 0.1, delay: 0.1, ease: 'easeOut' }
          }}
          exit={{
            opacity: 0,
            x: -20,
            transition: { duration: 0.1, ease: 'easeIn' }
          }}
        >
          <RealTimeQueries doctype="io.cozy.files" />

          {sortedFiles.length === 0 && files.fetchStatus === 'loading' && (
            <div className="u-flex u-flex-column u-flex-justify-center u-flex-items-center u-w-100 u-h-100">
              <CircularProgress size={72} />
            </div>
          )}

          {sortedFiles.length === 0 && files.fetchStatus === 'loaded' && (
            <div className="u-flex u-flex-column u-flex-justify-center u-flex-items-center u-w-100 u-h-100">
              <Typography
                variant="subtitle1"
                color="textSecondary"
                align="center"
              >
                {t('filepicker.no_files_found')}
              </Typography>
            </div>
          )}

          <List disablePadding>
            {sortedFiles.map(
              file =>
                file.name && (
                  <>
                    <FilePickerItem
                      key={file._id}
                      file={file}
                      id={`file-picker-item-${file._id}`}
                    />
                    <Divider />
                  </>
                )
            )}
          </List>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default FilePickerContent
