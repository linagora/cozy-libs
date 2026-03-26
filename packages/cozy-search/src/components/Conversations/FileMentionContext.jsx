import React, { createContext, useContext, useState, useRef } from 'react'

const FileMentionContext = createContext(null)

export const FileMentionProvider = ({ children, externalFileIDsRef }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const fileIDsRef = useRef([])

  const updateFileIDs = ids => {
    fileIDsRef.current = ids
    if (externalFileIDsRef) {
      externalFileIDsRef.current = ids
    }
  }

  const addFile = file => {
    setSelectedFiles(prev => {
      const updated = [...prev, file]
      updateFileIDs(updated.map(f => f.id))
      return updated
    })
  }

  const removeFile = fileId => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      updateFileIDs(updated.map(f => f.id))
      return updated
    })
  }

  const getFileIDs = () => fileIDsRef.current

  const value = {
    selectedFiles,
    addFile,
    removeFile,
    getFileIDs
  }

  return (
    <FileMentionContext.Provider value={value}>
      {children}
    </FileMentionContext.Provider>
  )
}

export const useFileMention = () => {
  const context = useContext(FileMentionContext)
  if (!context) {
    throw new Error('useFileMention must be used within FileMentionProvider')
  }
  return context
}
