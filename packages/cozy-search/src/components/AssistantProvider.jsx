import React, { useMemo, useContext, useState } from 'react'

import { DEFAULT_ASSISTANT } from './constants'
import { ChatUIStateProvider } from '../contexts/ChatUIStateContext'

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

/**
 * Twake-specific provider: it owns the "assistants" feature (selection,
 * create/edit/delete dialogs, websearch). It also mounts the reusable
 * ChatUIStateProvider so the shared chat views get their UI state.
 */
const AssistantProvider = ({ children }) => {
  const [isOpenCreateAssistant, setIsOpenCreateAssistant] = useState(false)
  const [isOpenDeleteAssistant, setIsOpenDeleteAssistant] = useState(false)
  const [isOpenEditAssistant, setIsOpenEditAssistant] = useState(false)
  const [assistantIdInAction, setAssistantIdInAction] = useState(null)
  const [selectedAssistantId, setSelectedAssistantId] = useState(
    DEFAULT_ASSISTANT._id
  )
  const [websearchEnabled, setWebsearchEnabled] = useState(false)

  const value = useMemo(
    () => ({
      isOpenCreateAssistant,
      isOpenDeleteAssistant,
      isOpenEditAssistant,
      assistantIdInAction,
      selectedAssistantId,
      setAssistantIdInAction,
      setIsOpenDeleteAssistant,
      setIsOpenCreateAssistant,
      setIsOpenEditAssistant,
      setSelectedAssistantId,
      websearchEnabled,
      setWebsearchEnabled
    }),
    [
      isOpenCreateAssistant,
      isOpenDeleteAssistant,
      isOpenEditAssistant,
      assistantIdInAction,
      selectedAssistantId,
      websearchEnabled
    ]
  )

  return (
    <AssistantContext.Provider value={value}>
      <ChatUIStateProvider>{children}</ChatUIStateProvider>
    </AssistantContext.Provider>
  )
}

export default React.memo(AssistantProvider)
