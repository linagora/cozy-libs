import React from 'react'

export interface AssistantContextValue {
  isOpenCreateAssistant: boolean
  isOpenDeleteAssistant: boolean
  isOpenEditAssistant: boolean
  assistantIdInAction: string | null
  selectedAssistantId: string
  setAssistantIdInAction: (id: string | null) => void
  setIsOpenDeleteAssistant: (isOpen: boolean) => void
  setIsOpenCreateAssistant: (isOpen: boolean) => void
  setIsOpenEditAssistant: (isOpen: boolean) => void
  setSelectedAssistantId: (id: string) => void
  websearchEnabled: boolean
  setWebsearchEnabled: React.Dispatch<React.SetStateAction<boolean>>
}

export function useAssistant(): AssistantContextValue

declare const AssistantProvider: React.ComponentType<{
  children?: React.ReactNode
}>
export default AssistantProvider
