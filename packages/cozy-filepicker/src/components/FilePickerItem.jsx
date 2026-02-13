import React from 'react'

import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Filename from 'cozy-ui/transpiled/react/Filename'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FileTypeFolderIcon from 'cozy-ui/transpiled/react/Icons/FileTypeFolder'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import FileItemIcon from 'cozy-ui-plus/src/ListItem/ListItemFile/ItemIcon'

const FilePickerItem = ({
  file,
  listItemProps,
  selectFile,
  selectedFiles,
  setDirectory,
  fileTypes,
  exists
}) => {
  return (
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
      disabled={
        exists ||
        (file.type !== 'directory' &&
          fileTypes &&
          !fileTypes.includes(file.mime))
      }
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
            file.type === 'directory' && (
              <Icon size={32} icon={FileTypeFolderIcon} />
            )
          }
        />
      </ListItemIcon>
      <div>
        <Filename
          variant="body1"
          filename={file.name.split('.')[0]}
          extension={file.type !== 'directory' && '.' + file.name.split('.')[1]}
        />
        {exists && (
          <Typography variant="caption" color="textSecondary">
            Already imported
          </Typography>
        )}
      </div>
    </ListItem>
  )
}

export default FilePickerItem
