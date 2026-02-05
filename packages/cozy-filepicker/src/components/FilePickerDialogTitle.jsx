import React from 'react'

import {
  DialogBackButton,
  DialogCloseButton
} from 'cozy-ui/transpiled/react/CozyDialogs'
import { DialogTitle } from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

const FilePickerDialogTitle = ({
  dialogTitleProps,
  dividerProps,
  onClose,
  selectedFiles
}) => {
  const { isMobile } = useBreakpoints()

  return (
    <>
      <DialogCloseButton onClick={onClose} />
      <DialogTitle {...dialogTitleProps}>
        {isMobile ? <DialogBackButton onClick={onClose} /> : null}
        Open {selectedFiles.length > 0 ? `(${selectedFiles.length} files)` : ''}
      </DialogTitle>
      <Divider {...dividerProps} />
    </>
  )
}

export default FilePickerDialogTitle
