import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'

import { useFileMention } from './FileMentionContext'

const FileChipsList = () => {
  const { selectedFiles, removeFile } = useFileMention()

  if (selectedFiles.length === 0) return null

  return (
    <div className="u-flex u-flex-wrap u-mt-half">
      {selectedFiles.map(file => (
        <Chip
          key={file.id}
          label={file.name}
          icon={
            file.icon?.component ? (
              <Icon icon={file.icon.component} size={16} />
            ) : undefined
          }
          onDelete={() => removeFile(file.id)}
          className="u-mr-half u-mb-half"
          size="small"
        />
      ))}
    </div>
  )
}

export default FileChipsList
