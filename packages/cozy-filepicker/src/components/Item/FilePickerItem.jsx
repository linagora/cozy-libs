import React from 'react'
import { useI18n } from 'twake-i18n'

import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Filename from 'cozy-ui/transpiled/react/Filename'
import Icon from 'cozy-ui/transpiled/react/Icon'
import FileTypeFolderIcon from 'cozy-ui/transpiled/react/Icons/FileTypeFolder'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import Typography from 'cozy-ui/transpiled/react/Typography'
import FileItemIcon from 'cozy-ui-plus/src/ListItem/ListItemFile/ItemIcon'

import { useFilePicker } from '../FilePickerContext'

const FilePickerItem = ({ file, ...props }) => {
  const {
    listItemProps,
    selectFile,
    openDirectory,
    isMimeTypeValid,
    existingFiles,
    isFileSelected
  } = useFilePicker()

  const { t } = useI18n()
  const exists = existingFiles.includes(file._id)

  return (
    <ListItem
      {...listItemProps}
      {...props}
      onClick={() => {
        if (file.type === 'directory') {
          openDirectory(file._id)
        } else {
          selectFile(file)
        }
      }}
      button
      disabled={exists || !isMimeTypeValid(file)}
    >
      <ListItemIcon>
        {file.type !== 'directory' && (
          <Checkbox
            checked={isFileSelected(file)}
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
            {t('filepicker.items.already_imported')}
          </Typography>
        )}
      </div>
    </ListItem>
  )
}
export default FilePickerItem
