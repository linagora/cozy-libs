import React from 'react'

import { RealTimeQueries, useQuery } from 'cozy-client'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Filename from 'cozy-ui/transpiled/react/Filename'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FileTypeFolderIcon from 'cozy-ui/transpiled/react/Icons/FileTypeFolder'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import ListSubheader from 'cozy-ui/transpiled/react/ListSubheader'
import Typography from 'cozy-ui/transpiled/react/Typography'
import FileItemIcon from 'cozy-ui-plus/src/ListItem/ListItemFile/ItemIcon'

import { buildFilesQuery } from '../queries'

const FilePickerContent = ({
  listItemProps,
  selectFile,
  selectedFiles,
  directory,
  setDirectory,
  currentDir
}) => {
  const filesQuery = buildFilesQuery(directory)
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
                <ListItem
                  {...listItemProps}
                  onClick={() => {
                    if (file.type === 'directory') {
                      setDirectory(file._id)
                    } else {
                      selectFile(file)
                    }
                  }}
                  button
                >
                  <ListItemIcon>
                    {file.type !== 'directory' && (
                      <Checkbox
                        checked={selectedFiles.includes(file)}
                        onClick={() => selectFile(file)}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemIcon>
                    <FileItemIcon
                      file={file}
                      icon={
                        file.type == 'directory' && (
                          <Icon size={32} icon={FileTypeFolderIcon} />
                        )
                      }
                    />
                  </ListItemIcon>
                  <Filename
                    variant="body1"
                    filename={file.name.split('.')[0]}
                    extension={
                      file.type !== 'directory' && '.' + file.name.split('.')[1]
                    }
                  />
                </ListItem>
                <Divider />
              </>
            )
        )}
      </List>
    </>
  )
}

export default FilePickerContent
