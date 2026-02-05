import React from 'react'

import { useQuery } from 'cozy-client'
import Divider from 'cozy-ui/transpiled/react/Divider'
import List from 'cozy-ui/transpiled/react/List'
import ListItemByDoc from 'cozy-ui-plus/src/ListItem/ListItemByDoc'

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
                <ListItemByDoc
                  key={file._id}
                  doc={file}
                  {...listItemProps}
                  onClick={() => selectFile(file)}
                  secondary={
                    selectedFiles?.includes(file) ? 'Selected' : undefined
                  }
                />
                <Divider />
              </>
            )
        )}
    </List>
  )
}

export default FilePickerContent
