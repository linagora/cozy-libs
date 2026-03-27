import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const MENTION_REGEX = /(^|\s)@([\w. ]*)$/

const FileMentionContext = createContext(null)

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [inputValue, setInputValue] = useState('')

  const mentionMatch = MENTION_REGEX.exec(inputValue)
  const hasMention = !!mentionMatch
  const mentionSearchTerm = mentionMatch ? mentionMatch[2] : ''

  const handleInputChange = useCallback(text => {
    setInputValue(text)
  }, [])

  const addFile = useCallback(file => {
    setSelectedFiles(prev => {
      if (prev.find(f => f.id === file.id)) return prev
      return [...prev, file]
    })
  }, [])

  const removeFile = useCallback(fileId => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const getAttachmentsIDs = useCallback(() => {
    return selectedFiles.map(f => f.id)
  }, [selectedFiles])

  const value = useMemo(
    () => ({
      selectedFiles,
      addFile,
      removeFile,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs
    }),
    [
      selectedFiles,
      addFile,
      removeFile,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs
    ]
  )

  return (
    <FileMentionContext.Provider value={value}>
      {children}
    </FileMentionContext.Provider>
  )
}

export const useFileMention = () => {
  const ctx = useContext(FileMentionContext)
  if (!ctx) throw new Error('useFileMention must be used within FileMentionProvider')
  return ctx
}
