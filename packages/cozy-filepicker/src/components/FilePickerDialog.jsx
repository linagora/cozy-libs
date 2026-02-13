import React from 'react'
import { useExtendI18n } from 'twake-i18n'

import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Dialog from 'cozy-ui/transpiled/react/Dialog'

import { locales } from '../locales'
import FilePickerContent from './Dialog/FilePickerContent'
import FilePickerDialogActions from './Dialog/FilePickerDialogActions'
import FilePickerDialogTitle from './Dialog/FilePickerDialogTitle'
import { FilePickerProvider } from './FilePickerContext'

const FilePickerDialog = ({
  open,
  onClose,
  onFilesSelected,
  multiple = true,
  fileTypes,
  existingFiles
}) => {
  useExtendI18n(locales)
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

  return (
    <FilePickerProvider
      open={open}
      onClose={onClose}
      onFilesSelected={onFilesSelected}
      multiple={multiple}
      fileTypes={fileTypes}
      existingFiles={existingFiles}
      dialogTitleProps={dialogTitleProps}
      listItemProps={listItemProps}
      dividerProps={dividerProps}
      dialogActionsProps={dialogActionsProps}
    >
      <Dialog {...dialogProps}>
        <FilePickerDialogTitle />
        <FilePickerContent />
        <FilePickerDialogActions />
      </Dialog>
    </FilePickerProvider>
  )
}

export default FilePickerDialog
