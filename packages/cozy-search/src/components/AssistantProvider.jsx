import React, { useMemo, useContext, useState, useCallback } from 'react'

import { DEFAULT_ASSISTANT } from './constants'

export const AssistantContext = React.createContext()

/**
 * @returns {import('./AssistantProvider').AssistantContextValue}
 */
export const useAssistant = () => {
  const context = useContext(AssistantContext)

  if (!context) {
    throw new Error('useAssistant must be used within a AssistantProvider')
  }
  return context
}

const AssistantProvider = ({ children }) => {
  const [isOpenCreateAssistant, setIsOpenCreateAssistant] = useState(false)
  const [isOpenDeleteAssistant, setIsOpenDeleteAssistant] = useState(false)
  const [isOpenEditAssistant, setIsOpenEditAssistant] = useState(false)
  const [assistantIdInAction, setAssistantIdInAction] = useState(null)
  const [selectedAssistantId, setSelectedAssistantId] = useState(
    DEFAULT_ASSISTANT._id
  )
  const [isOpenSearchConversation, setIsOpenSearchConversation] =
    useState(false)
  const [websearchEnabled, setWebsearchEnabled] = useState(false)

  // Per-conversation Drive restriction for the default assistant:
  // conversationId → docs picked in the Drive file picker. No entry means
  // "search in all my documents". Resolutions (flat file ids + status) are
  // published back by AttachmentsResolver, keyed the same way.
  const [attachmentsSelections, setAttachmentsSelections] = useState({})
  const [attachmentsResolutions, setAttachmentsResolutions] = useState({})

  const setForConversation = (setState, conversationId, value) => {
    setState(prev => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        if (!(conversationId in prev)) return prev
        const next = { ...prev }
        delete next[conversationId]
        return next
      }
      return { ...prev, [conversationId]: value }
    })
  }

  const setAttachmentsSelection = useCallback((conversationId, docs) => {
    setForConversation(setAttachmentsSelections, conversationId, docs)
  }, [])

  const setAttachmentsResolution = useCallback((conversationId, resolution) => {
    setForConversation(setAttachmentsResolutions, conversationId, resolution)
  }, [])

  const value = useMemo(
    () => ({
      isOpenCreateAssistant,
      isOpenDeleteAssistant,
      isOpenEditAssistant,
      assistantIdInAction,
      selectedAssistantId,
      isOpenSearchConversation,
      setAssistantIdInAction,
      setIsOpenDeleteAssistant,
      setIsOpenCreateAssistant,
      setIsOpenEditAssistant,
      setSelectedAssistantId,
      setIsOpenSearchConversation,
      websearchEnabled,
      setWebsearchEnabled,
      attachmentsSelections,
      setAttachmentsSelection,
      attachmentsResolutions,
      setAttachmentsResolution
    }),
    [
      isOpenCreateAssistant,
      isOpenDeleteAssistant,
      isOpenEditAssistant,
      assistantIdInAction,
      selectedAssistantId,
      isOpenSearchConversation,
      websearchEnabled,
      attachmentsSelections,
      attachmentsResolutions
    ]
  )

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export default React.memo(AssistantProvider)
