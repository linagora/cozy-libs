import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

import { MENTION_MATCH_REGEX, MENTION_REPLACE_REGEX } from './mentionConstants'

const FileMentionContext = createContext(null)

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [inputValue, setInputValue] = useState('')

  const addFile = useCallback(file => {
    setSelectedFiles(prev => [...prev, file])
  }, [])

  const removeFile = useCallback(fileId => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const removeMentionText = useCallback(() => {
    setInputValue(prev => prev.replace(MENTION_REPLACE_REGEX, '$1'))
  }, [])

  const handleInputChange = useCallback(newValue => {
    setInputValue(newValue)
  }, [])

  const mentionMatch = inputValue.match(MENTION_MATCH_REGEX)
  const hasMention = mentionMatch !== null
  const mentionSearchTerm = mentionMatch ? mentionMatch[2] : ''

  const getAttachmentsIDs = useCallback(
    () => selectedFiles.map(f => f.id),
    [selectedFiles]
  )

  const value = useMemo(
    () => ({
      selectedFiles,
      inputValue,
      addFile,
      removeFile,
      removeMentionText,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      getAttachmentsIDs
    }),
    [
      selectedFiles,
      inputValue,
      addFile,
      removeFile,
      removeMentionText,
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
  const context = useContext(FileMentionContext)
  if (!context) {
    throw new Error('useFileMention must be used within FileMentionProvider')
  }
  return context
}
