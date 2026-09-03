import isUndefined from 'lodash/isUndefined'
import omitBy from 'lodash/omitBy'
import React, { createContext, useContext, useMemo, ReactNode } from 'react'

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
  AssistantIcon: null,
  useSearchConversationEnabled: () => false
}

const ChatComponentsContext = createContext<ChatComponents>(defaults)

export const ChatComponentsProvider = ({
  components,
  children
}: {
  components: Partial<ChatComponents>
  children: ReactNode
}): JSX.Element => {
  // A slot explicitly set to `undefined` means "not provided": a caller
  // building the map conditionally would otherwise overwrite the no-op default
  // with undefined and crash the views. `null` is kept, since it is a
  // meaningful value for AssistantIcon.
  const value = useMemo(
    () => ({ ...defaults, ...omitBy(components, isUndefined) }),
    [components]
  )

  return (
    <ChatComponentsContext.Provider value={value}>
      {children}
    </ChatComponentsContext.Provider>
  )
}

export const useChatComponents = (): ChatComponents =>
  useContext(ChatComponentsContext)
