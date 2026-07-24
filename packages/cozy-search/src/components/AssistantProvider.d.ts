import React from 'react'

export interface AttachmentsResolution {
  attachmentIds: string[]
  isOverLimit: boolean
  isLoading: boolean
  isUnavailable: boolean
  isEmpty: boolean
}

export interface AttachmentsSelectionDoc {
  _id?: string
  id?: string
  type?: string
  name?: string
  dir_id?: string
}

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
  attachmentsSelections: Record<string, AttachmentsSelectionDoc[]>
  setAttachmentsSelection: (
    conversationId: string,
    docs: AttachmentsSelectionDoc[] | null
  ) => void
  attachmentsResolutions: Record<string, AttachmentsResolution>
  setAttachmentsResolution: (
    conversationId: string,
    resolution: AttachmentsResolution | null
  ) => void
}

export function useAssistant(): AssistantContextValue
