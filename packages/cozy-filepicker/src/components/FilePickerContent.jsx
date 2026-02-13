import React from 'react'

import { RealTimeQueries, useQuery } from 'cozy-client'
import Divider from 'cozy-ui/transpiled/react/Divider'
import List from 'cozy-ui/transpiled/react/List'
import Typography from 'cozy-ui/transpiled/react/Typography'

import FilePickerItem from './FilePickerItem'
import { buildFilesQuery } from '../queries'

const FilePickerContent = ({
  listItemProps,
  selectFile,
  selectedFiles,
  directory,
  setDirectory,
  fileTypes,
  search,
  existingFiles
}) => {
  const filesQuery = buildFilesQuery(search ? null : directory, search)
  const files = useQuery(filesQuery.definition, filesQuery.options)

  const sortedFiles = files.data
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

  return (
    <>
      <RealTimeQueries doctype="io.cozy.files" />

      {sortedFiles.length === 0 && files.fetchStatus === 'loaded' && (
        <div className="u-flex u-flex-column u-flex-justify-center u-flex-items-center u-w-100 u-h-100">
          <Typography variant="subtitle1" color="textSecondary" align="center">
            No files found
          </Typography>
        </div>
      )}

      <List>
        {sortedFiles.map(
          file =>
            file.name && (
              <>
                <FilePickerItem
                  key={file._id}
                  file={file}
                  listItemProps={listItemProps}
                  selectFile={selectFile}
                  selectedFiles={selectedFiles}
                  setDirectory={setDirectory}
                  fileTypes={fileTypes}
                  exists={existingFiles.includes(file._id)}
                />
                <Divider />
              </>
            )
        )}
      </List>
    </>
  )
}

export default FilePickerContent
