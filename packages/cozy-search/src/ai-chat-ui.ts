// Sidebar requires a ChatUIStateProvider + ConversationStoreProvider +
// ChatComponentsProvider above it (and a router context for useConversation);
// it pulls in no Cozy backend.
export { default as Sidebar } from './components/Sidebar'
// Shared chat UI state (the conversation search panel). Sidebar and
// useConversation read it, so mount the provider above them. The Cozy app's
// AssistantProvider mounts it for you; it is Twake-specific and stays out of
// this entry.
export {
  ChatUIStateProvider,
  useChatUIState
} from './contexts/ChatUIStateContext'
export type { ChatUIState } from './contexts/ChatUIStateContext'
export { default as Conversation } from './components/Conversations/Conversation'
export { default as CozyComposer } from './components/Conversations/ConversationComposer'
export { default as ConversationList } from './components/Conversations/ConversationList'
export { default as AssistantMessage } from './components/Messages/AssistantMessage'
export { default as UserMessage } from './components/Messages/UserMessage'
// Presentational source list + knowledge-base chip: they receive ready-made
// links (and icons) from whichever adapter fills the ChatComponents seams,
// so a standalone app can compose its own SourcesRenderer / ComposerExtras
// out of them instead of reimplementing the UI.
export { Sources } from './components/Conversations/Sources/Sources'
export { default as KnowledgeBaseChip } from './components/KnowledgeBase/KnowledgeBaseChip'
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
