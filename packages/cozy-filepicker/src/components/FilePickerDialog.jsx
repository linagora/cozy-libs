import React from 'react'
import { useEffect } from 'react'

import { useQuery } from 'cozy-client'
import { useCozyDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import useBreakpoints from 'cozy-ui/transpiled/react/providers/Breakpoints'

import FilePickerContent from './FilePickerContent'
import FilePickerDialogActions from './FilePickerDialogActions'
import FilePickerDialogTitle from './FilePickerDialogTitle'
import { buildFileQuery } from '../queries'

const FilePickerDialog = ({
  open,
  onClose,
  onFilesSelected,
  multiple = true,
  fileTypes,
  existingFiles
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

  const { isMobile } = useBreakpoints()

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

  const [search, setSearch] = React.useState('')
  const normalizedSearch = search.normalize('NFD').replace(/\p{M}/gu, '')

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
        search={search}
        setSearch={setSearch}
      />
      <div
        className={isMobile ? 'u-h-100' : 'u-h-6'}
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
          fileTypes={fileTypes}
          search={normalizedSearch}
          existingFiles={existingFiles}
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
