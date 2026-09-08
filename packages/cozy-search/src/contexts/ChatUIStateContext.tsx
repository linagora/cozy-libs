import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode
} from 'react'

export interface ChatUIState {
  isOpenSearchConversation: boolean
  setIsOpenSearchConversation: React.Dispatch<React.SetStateAction<boolean>>
}

// Ephemeral UI state shared across the chat views — currently just whether the
// conversation search panel is open. It is deliberately separate from the Cozy
// app's AssistantProvider, which owns the Twake-specific "assistants" feature
// (selection, create/edit/delete dialogs, websearch).
//
// Like ConversationStore, this throws without a provider rather than falling
// back to inert defaults: a missing provider is a wiring mistake, and failing
// loudly beats a toggle that silently does nothing.
const ChatUIStateContext = createContext<ChatUIState | null>(null)

export const ChatUIStateProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [isOpenSearchConversation, setIsOpenSearchConversation] =
    useState(false)

  const value = useMemo(
    () => ({ isOpenSearchConversation, setIsOpenSearchConversation }),
    [isOpenSearchConversation]
  )

  return (
    <ChatUIStateContext.Provider value={value}>
      {children}
    </ChatUIStateContext.Provider>
  )
}

export const useChatUIState = (): ChatUIState => {
  const state = useContext(ChatUIStateContext)
  if (!state) {
    throw new Error('useChatUIState must be used within a ChatUIStateProvider')
  }
  return state
}
