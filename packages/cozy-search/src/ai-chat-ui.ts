// Sidebar requires an AssistantProvider + ConversationStoreProvider +
// ChatComponentsProvider above it (and a router context for useConversation);
// it pulls in no Cozy backend.
export { default as Sidebar } from './components/Sidebar'
// AssistantProvider is cozy-free (pure React state); Sidebar and
// useConversation read it via useAssistant(), so consumers must mount it.
export { default as AssistantProvider } from './components/AssistantProvider'
export { default as Conversation } from './components/Conversations/Conversation'
export { default as CozyComposer } from './components/Conversations/ConversationComposer'
export { default as ConversationList } from './components/Conversations/ConversationList'
export { default as AssistantMessage } from './components/Messages/AssistantMessage'
export { default as UserMessage } from './components/Messages/UserMessage'
export {
  ConversationStoreProvider,
  useConversationStore
} from './contexts/ConversationStoreContext'
export type {
  ConversationStore,
  ConversationSummary,
  StoredMessage,
  StoredSource,
  UseConversationsResult
} from './contexts/ConversationStore'
export {
  ChatComponentsProvider,
  useChatComponents
} from './contexts/ChatComponentsContext'
export type { ChatComponents } from './contexts/ChatComponents'
export { locales } from './locales'
