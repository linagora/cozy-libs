import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react'

import { MENTION_MATCH_REGEX, MENTION_REPLACE_REGEX } from './mentionConstants'

const FileMentionContext = createContext(null)

export const FileMentionProvider = ({ children }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [inputValue, setInputValue] = useState('')
  const menuKeyDownRef = useRef(null)

  const addFile = useCallback(file => {
    setSelectedFiles(prev => {
      if (prev.some(f => f.id === file.id)) return prev
      return [...prev, file]
    })
  }, [])

  const removeFile = useCallback(fileId => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const reset = useCallback(() => {
    setSelectedFiles([])
    setInputValue('')
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

  const pendingAttachmentsRef = useRef(null)

  const snapshotAttachmentsIDs = useCallback(() => {
    pendingAttachmentsRef.current = selectedFiles.map(f => f.id)
  }, [selectedFiles])

  const getAttachmentsIDs = useCallback(() => {
    const ids = pendingAttachmentsRef.current || []
    pendingAttachmentsRef.current = null
    return ids
  }, [])

  const value = useMemo(
    () => ({
      selectedFiles,
      inputValue,
      addFile,
      removeFile,
      reset,
      removeMentionText,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      snapshotAttachmentsIDs,
      getAttachmentsIDs,
      menuKeyDownRef
    }),
    [
      selectedFiles,
      inputValue,
      addFile,
      removeFile,
      reset,
      removeMentionText,
      handleInputChange,
      hasMention,
      mentionSearchTerm,
      snapshotAttachmentsIDs,
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
