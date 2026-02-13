import React, { createContext, useContext, useState, useEffect } from 'react'

import { useQuery, useClient } from 'cozy-client'

import { buildFileQuery } from '../queries'

const FilePickerContext = createContext()

export const useFilePicker = () => {
  const context = useContext(FilePickerContext)
  if (!context) {
    throw new Error('useFilePicker must be used within a FilePickerProvider')
  }
  return context
}

export const FilePickerProvider = ({
  children,
  open,
  onClose,
  onFilesSelected,
  multiple = true,
  fileTypes,
  existingFiles,
  dialogTitleProps,
  listItemProps,
  dividerProps,
  dialogActionsProps
}) => {
  const [selectedFiles, setSelectedFiles] = useState([])

  const isMimeTypeValid = file => {
    if (file.type == 'directory') {
      return true
    }
    return fileTypes && fileTypes.includes(file.mime)
  }

  const selectFile = file => {
    if (Array.isArray(file)) {
      if (!multiple) {
        if (file.length > 0 && isMimeTypeValid(file[0])) {
          setSelectedFiles([file[0]])
        }
        return
      }
      const newFiles = file.filter(f => isMimeTypeValid(f))
      const combinedFiles = [...selectedFiles, ...newFiles]
      // deduplicate by id
      const uniqueFiles = combinedFiles.filter(
        (f, index, self) => index === self.findIndex(t => t.id === f.id)
      )
      setSelectedFiles(uniqueFiles)
      return
    }

    if (!isMimeTypeValid(file)) {
      return
    }
    if (selectedFiles.find(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id))
    } else {
      if (!multiple) {
        setSelectedFiles([file])
      } else {
        setSelectedFiles([...selectedFiles, file])
      }
    }
  }

  const isFileSelected = file => {
    return selectedFiles.find(f => f._id === file._id) !== undefined
  }

  const handleFilesSelected = () => {
    onFilesSelected(selectedFiles)
  }

  const [directory, setDirectory] = useState('io.cozy.files.root-dir')

  const directoryQuery = buildFileQuery(directory)
  const directoryFile = useQuery(
    directoryQuery.definition,
    directoryQuery.options
  )
  const [currentDir, setCurrentDir] = useState(null)

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
    setSelectedFiles([])
    setDirectory('io.cozy.files.root-dir')
    setSearch('')
    setUploadingFile(false)
    setLastUploadedFileId(null)
  }, [open])

  const openDirectory = dirId => {
    if (search.length > 0) {
      setSearch('')
    }
    setDirectory(dirId)
    setSelectedFiles([])
  }

  const [search, setSearch] = useState('')

  const client = useClient()
  const [lastUploadedFileId, setLastUploadedFileId] = useState(null)

  const [uploadingFile, setUploadingFile] = useState(false)

  const uploadFile = async (file, dirId = directory) => {
    if (!file) {
      return
    }

    if (Array.isArray(file) || file instanceof FileList) {
      const files = Array.from(file)
      try {
        setUploadingFile(true)
        const promises = files.map(f =>
          client.save({
            name: f.name,
            dirId,
            data: f,
            _type: 'io.cozy.files'
          })
        )
        const responses = await Promise.all(promises)
        setUploadingFile(false)
        const uploadedFiles = responses.map(r => r.data)
        selectFile(uploadedFiles)
        if (uploadedFiles.length > 0) {
          setLastUploadedFileId(uploadedFiles[uploadedFiles.length - 1]._id)
        }
        return uploadedFiles
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error uploading files', error)
        setUploadingFile(false)
        throw error
      }
    }

    try {
      setUploadingFile(true)
      const response = await client.save({
        name: file.name,
        dirId,
        data: file,
        _type: 'io.cozy.files'
      })
      setUploadingFile(false)
      selectFile(response.data)
      setLastUploadedFileId(response.data._id)
      return response.data
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading file', error)
      setUploadingFile(false)
      throw error
    }
  }

  const normalizedSearch = search.normalize('NFD').replace(/\p{M}/gu, '')

  const value = {
    open,
    onClose,
    onFilesSelected: handleFilesSelected,
    multiple,
    fileTypes,
    existingFiles,
    dialogTitleProps,
    listItemProps,
    dividerProps,
    dialogActionsProps,
    selectedFiles,
    selectFile,
    directory,
    setDirectory,
    openDirectory,
    currentDir,
    goBack,
    search,
    setSearch,
    normalizedSearch,
    isFileSelected,
    lastUploadedFileId,
    uploadFile,
    uploadingFile,
    isMimeTypeValid
  }

  return (
    <FilePickerContext.Provider value={value}>
      {children}
    </FilePickerContext.Provider>
  )
}

export default FilePickerProvider
