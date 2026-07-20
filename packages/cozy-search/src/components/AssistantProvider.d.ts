import React from 'react'

export interface AssistantContextValue {
  isOpenCreateAssistant: boolean
  isOpenDeleteAssistant: boolean
  isOpenEditAssistant: boolean
  assistantIdInAction: string | null
  selectedAssistantId: string
  isOpenSearchConversation: boolean
  setAssistantIdInAction: (id: string | null) => void
  setIsOpenDeleteAssistant: (isOpen: boolean) => void
  setIsOpenCreateAssistant: (isOpen: boolean) => void
  setIsOpenEditAssistant: (isOpen: boolean) => void
  setSelectedAssistantId: (id: string) => void
  setIsOpenSearchConversation: (isOpen: boolean) => void
  websearchEnabled: boolean
  setWebsearchEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export function useAssistant(): AssistantContextValue
