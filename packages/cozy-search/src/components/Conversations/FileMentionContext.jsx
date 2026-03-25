import React, { createContext, useContext, useState, useRef } from 'react'

const FileMentionContext = createContext(null)

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [inputValue, setInputValue] = useState('')
  const fileIDsRef = useRef([])

  const addFile = file => {
    setSelectedFiles(prev => {
      const updated = [...prev, file]
      fileIDsRef.current = updated.map(f => f.id)
      return updated
    })
  }

  const removeFile = fileId => {
    setSelectedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      fileIDsRef.current = updated.map(f => f.id)
      return updated
    })
  }

  const removeMentionText = () => {
    setInputValue(prev => prev.replace(/@\w*$/, ''))
  }

  const handleInputChange = newValue => {
    setInputValue(newValue)
  }

  const mentionMatch = inputValue.match(/@(\w*)$/)
  const hasMention = mentionMatch !== null
  const mentionSearchTerm = mentionMatch ? mentionMatch[1] : ''

  const getFileIDs = () => fileIDsRef.current

  const value = {
    selectedFiles,
    inputValue,
    addFile,
    removeFile,
    removeMentionText,
    handleInputChange,
    hasMention,
    mentionSearchTerm,
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
