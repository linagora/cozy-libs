import React from 'react'

import { useQuery } from 'cozy-client'
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
import FileItemIcon from 'cozy-ui-plus/src/ListItem/ListItemFile/ItemIcon'

import { buildFilesQuery } from '../queries'

const FilePickerContent = ({ listItemProps, selectFile, selectedFiles }) => {
  const filesQuery = buildFilesQuery()
  const files = useQuery(filesQuery.definition, filesQuery.options)

  return (
    <List>
      {files.data &&
        files.data.map(
          file =>
            file.name && (
              <>
                <ListItem
                  {...listItemProps}
                  onClick={() => selectFile(file)}
                  button
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedFiles.includes(file)}
                      onClick={() => selectFile(file)}
                    />
                  </ListItemIcon>
                  <ListItemIcon>
                    {file.type == 'directory' ? (
                      <Icon size={32} icon={FileTypeFolderIcon} />
                    ) : (
                      <FileItemIcon file={file} />
                    )}
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
  )
}

export default FilePickerContent
