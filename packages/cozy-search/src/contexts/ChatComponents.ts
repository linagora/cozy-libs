import type { ComponentType } from 'react'

import type { ConversationSummary, StoredSource } from './ConversationStore'

export interface ChatComponents {
  SourcesRenderer: ComponentType<{ messageId: string; sources: StoredSource[] }>
  ComposerExtras: ComponentType<{ disabled?: boolean }>
  ConversationActions: ComponentType<{
    buttonClassName?: string
    conversation: ConversationSummary
  }>
  useSearchConversationEnabled: () => boolean
}
