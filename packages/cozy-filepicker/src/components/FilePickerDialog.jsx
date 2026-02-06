import React from 'react'

import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Dialog from 'cozy-ui/transpiled/react/Dialog'

import FilePickerContent from './FilePickerContent'
import FilePickerDialogActions from './FilePickerDialogActions'
import FilePickerDialogTitle from './FilePickerDialogTitle'
import { useEffect } from 'react'

const FilePickerDialog = ({ open, onClose, onFilesSelected, multiple = true }) => {
  const {
    dialogProps,
    dialogTitleProps,
    listItemProps,
    dividerProps,
    dialogActionsProps
  } = useCozyDialog({
    size: 'large',
    classes: {
      paper: 'my-class'
    },
    open,
    onClose,
    disableEnforceFocus: true
  })

  const [selectedFiles, setSelectedFiles] = React.useState([])

  const selectFile = file => {
    if (selectedFiles.includes(file)) {
      setSelectedFiles(selectedFiles.filter(f => f !== file))
    } else {
      if (!multiple) {
        setSelectedFiles([file])
      } else {
        setSelectedFiles([...selectedFiles, file])
      }
    }
  }

  const handleFilesSelected = () => {
    onFilesSelected(selectedFiles)
  }

  useEffect(() => {
    if (open) {
      setSelectedFiles([])
    }
  }, [open])

  return (
    <Dialog {...dialogProps}>
      <FilePickerDialogTitle
        dialogTitleProps={dialogTitleProps}
        dividerProps={dividerProps}
        onClose={onClose}
        selectedFiles={selectedFiles}
        multiple={multiple}
      />
      <div
        className="u-h-6"
        style={{
          overflowY: 'auto'
        }}
      >
        <FilePickerContent
          listItemProps={listItemProps}
          selectedFiles={selectedFiles ?? []}
          selectFile={selectFile}
        />
      </div>
      <FilePickerDialogActions
        dialogActionsProps={dialogActionsProps}
        dividerProps={dividerProps}
        onClose={onClose}
        selectedFiles={selectedFiles}
        onFilesSelected={handleFilesSelected}
      />
    </Dialog>
  )
}

export default FilePickerDialog
