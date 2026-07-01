import React, { createContext, useContext, ReactNode } from 'react'

import type { ChatComponents } from './ChatComponents'

// These defaults are intentional no-ops: every ChatComponents slot is an
// OPTIONAL injection point, so rendering the views without a
// ChatComponentsProvider yields no extras/sources/actions rather than a crash.
// This differs deliberately from ConversationStore, which is REQUIRED data and
// therefore throws when its provider is missing.
const defaults: ChatComponents = {
  SourcesRenderer: () => null,
  ComposerExtras: () => null,
  ConversationActions: () => null,
  useSearchConversationEnabled: () => false
}

const ChatComponentsContext = createContext<ChatComponents>(defaults)

export const ChatComponentsProvider = ({
  components,
  children
}: {
  components: Partial<ChatComponents>
  children: ReactNode
}): JSX.Element => (
  <ChatComponentsContext.Provider value={{ ...defaults, ...components }}>
    {children}
  </ChatComponentsContext.Provider>
)

export const useChatComponents = (): ChatComponents =>
  useContext(ChatComponentsContext)
