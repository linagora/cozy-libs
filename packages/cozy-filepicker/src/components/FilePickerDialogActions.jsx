import React from 'react'

import { DialogActions } from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Button from 'cozy-ui/transpiled/react/deprecated/Button'

const FilePickerDialogActions = ({
  dialogActionsProps,
  dividerProps,
  onClose,
  onFilesSelected,
  selectedFiles
}) => {
  return (
    <>
      <Divider {...dividerProps} />
      <DialogActions {...dialogActionsProps}>
        <Button theme="secondary" onClick={() => onClose()} label="Cancel" />
        <Button
          theme="primary"
          label="Open"
          onClick={() => onFilesSelected(selectedFiles)}
          disabled={selectedFiles.length === 0}
        />
      </DialogActions>
    </>
  )
}

export default FilePickerDialogActions
