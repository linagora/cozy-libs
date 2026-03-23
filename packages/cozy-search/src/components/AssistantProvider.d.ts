import React from 'react'

export interface TwakeKnowledgeState {
  drive: { id: string; name: string }[]
  mail: { id: string; name: string }[]
  chat: { id: string; name: string }[]
}

export interface AssistantContextValue {
  isOpenCreateAssistant: boolean
  isOpenDeleteAssistant: boolean
  isOpenEditAssistant: boolean
  assistantIdInAction: string | null
  selectedAssistantId: string
  isOpenSearchConversation: boolean
  openedKnowledgePanel: string | null
  selectedTwakeKnowledge: TwakeKnowledgeState
  setAssistantIdInAction: (id: string | null) => void
  setIsOpenDeleteAssistant: (isOpen: boolean) => void
  setIsOpenCreateAssistant: (isOpen: boolean) => void
  setIsOpenEditAssistant: (isOpen: boolean) => void
  setSelectedAssistantId: (id: string) => void
  setIsOpenSearchConversation: (isOpen: boolean) => void
  setOpenedKnowledgePanel: (panel: string | null) => void
  setSelectedTwakeKnowledge: React.Dispatch<
    React.SetStateAction<TwakeKnowledgeState>
  >
}

export function useAssistant(): AssistantContextValue
