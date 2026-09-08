import type { ComponentType } from 'react'

import type { ConversationSummary, StoredSource } from './ConversationStore'

export interface ChatComponents {
  SourcesRenderer: ComponentType<{ messageId: string; sources: StoredSource[] }>
  ComposerExtras: ComponentType<{ disabled?: boolean }>
  ConversationActions: ComponentType<{
    buttonClassName?: string
    conversation: ConversationSummary
  }>
  // Branding: the mark standing for the assistant itself (shown while it is
  // thinking). The reusable layer ships none — a host app injects its own.
  AssistantIcon: ComponentType<Record<string, unknown>> | null
  useSearchConversationEnabled: () => boolean
}
