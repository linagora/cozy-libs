export interface StoredSource {
  id?: string
  doctype?: string
  sourceType?: string
  url?: string
  title?: string
  snippet?: string
}

export interface StoredMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: StoredSource[]
}

export interface ConversationAssistant {
  icon?: string
  name?: string
}

export interface ConversationSummary {
  _id: string
  name?: string
  messages?: StoredMessage[]
  cozyMetadata?: { updatedAt?: string }
  // Hydrated assistant, read directly by ConversationListItem to render its avatar.
  assistant?: ConversationAssistant
  relationships?: { assistant?: { data: { _id: string } } }
}

export interface UseConversationsResult {
  conversations: ConversationSummary[]
  hasMore: boolean
  isLoading: boolean
  fetchMore: () => void | Promise<void>
}

export interface ConversationStore {
  useConversations: () => UseConversationsResult
  useConversationMessages: (conversationId: string) => {
    messages: StoredMessage[]
    isLoading: boolean
  }
  createConversation: () => Promise<string>
  deleteConversation: (conversationId: string) => Promise<void>
  renameConversation: (conversationId: string, name: string) => Promise<void>
}
