export { default as AssistantLink } from './components/Search/AssistantLink'
export { default as AssistantDesktop } from './components/AssistantDesktop'
export { default as AssistantMobile } from './components/AssistantMobile'
export { default as AssistantDialog } from './components/Views/AssistantDialog'
export { default as CreateAssistantDialog } from './components/Views/CreateAssistantDialog'
export { default as SearchDialog } from './components/Views/SearchDialog'
export { default as AiText } from './components/Icons/AiText'

// New assistant-ui based components
export { default as CozyAssistantRuntimeProvider } from './components/CozyAssistantRuntimeProvider'
export { default as CozyComposer } from './components/Conversations/ConversationComposer'
export {
  StreamBridge,
  createCozyRealtimeChatAdapter
} from './components/adapters'
export { default as AssistantView } from './components/Views/AssistantView'

export { default as Sidebar } from './components/Sidebar'
export { default as Conversation } from './components/Conversations/Conversation'
export { default as AssistantMessage } from './components/Messages/AssistantMessage'
export { default as UserMessage } from './components/Messages/UserMessage'
export { Sources } from './components/Conversations/Sources/Sources'

// Seams
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

// Cozy default implementations (for the existing Cozy app)
export { default as CozyConversationStoreProvider } from './contexts/cozy/CozyConversationStoreProvider'
export { useCozyConversationStore } from './contexts/cozy/CozyConversationStore'
export { useCozySearchConversationEnabled } from './contexts/cozy/useCozySearchConversationEnabled'
export { default as CozySourcesWithFilesQuery } from './components/Conversations/Sources/CozySourcesWithFilesQuery'
export { default as CozyComposerExtras } from './components/Conversations/CozyComposerExtras'

// i18n locales for foreign apps
export { locales } from './locales'
