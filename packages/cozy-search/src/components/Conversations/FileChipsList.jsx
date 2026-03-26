import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'

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
          onDelete={() => removeFile(file.id)}
          className="u-mr-half u-mb-half"
          size="small"
        />
      ))}
    </div>
  )
}

export default FileChipsList
