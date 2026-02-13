import React from 'react'
import { useEffect } from 'react'

import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Dialog from 'cozy-ui/transpiled/react/Dialog'

import FilePickerContent from './FilePickerContent'
import FilePickerDialogActions from './FilePickerDialogActions'
import FilePickerDialogTitle from './FilePickerDialogTitle'
import { buildFileQuery } from '../queries'
import { useQuery } from 'cozy-client'

const FilePickerDialog = ({
  open,
  onClose,
  onFilesSelected,
  multiple = true
}) => {
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

  const [directory, setDirectory] = React.useState('io.cozy.files.root-dir')

  const directoryQuery = buildFileQuery(directory)
  const directoryFile = useQuery(
    directoryQuery.definition,
    directoryQuery.options
  )
  const [currentDir, setCurrentDir] = React.useState(null)

  useEffect(() => {
    if (directoryFile.data && directoryFile.data.length > 0) {
      setCurrentDir(directoryFile.data[0])
    }
  }, [directoryFile.data])

  const goBack = () => {
    if (directory === 'io.cozy.files.root-dir') {
      onClose()
    } else {
      setDirectory(currentDir?.dir_id || 'io.cozy.files.root-dir')
    }
  }

  useEffect(() => {
    if (open) {
      setSelectedFiles([])
      setDirectory('io.cozy.files.root-dir')
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
        currentDir={currentDir}
        goBack={goBack}
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
          directory={directory}
          setDirectory={setDirectory}
          currentDir={currentDir}
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
