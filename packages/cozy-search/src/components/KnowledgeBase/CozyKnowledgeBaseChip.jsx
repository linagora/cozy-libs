import React, { useState } from 'react'

import { useClient } from 'cozy-client'

import FolderPickerDialog from './FolderPickerDialog'
import KnowledgeBaseChip from './KnowledgeBaseChip'
import TDrive from '../../assets/tdrive.png'
import { makeFolderUrl } from '../cozyWebLinks'

/**
 * Cozy adapter for the knowledge-base chip: resolves the Drive link and owns
 * the Drive folder picker (a cozy-interapp intent), so the chip itself stays
 * presentational.
 */
const CozyKnowledgeBaseChip = ({
  dirId,
  folder,
  isUnavailable,
  isLast,
  onChangeFolder
}) => {
  const client = useClient()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  return (
    <>
      <KnowledgeBaseChip
        icon={TDrive}
        folderName={folder?.name}
        folderUrl={makeFolderUrl(client, dirId)}
        isUnavailable={isUnavailable}
        isLast={isLast}
        onChangeFolder={() => setIsPickerOpen(true)}
      />
      {isPickerOpen && (
        <FolderPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={onChangeFolder}
        />
      )}
    </>
  )
}

export default CozyKnowledgeBaseChip
