import React, { createContext, useContext, ReactNode } from 'react'

import type { ConversationStore } from './ConversationStore'

const ConversationStoreContext = createContext<ConversationStore | null>(null)

export const ConversationStoreProvider = ({
  store,
  children
}: {
  store: ConversationStore
  children: ReactNode
}): JSX.Element => (
  <ConversationStoreContext.Provider value={store}>
    {children}
  </ConversationStoreContext.Provider>
)

export const useConversationStore = (): ConversationStore => {
  const store = useContext(ConversationStoreContext)
  if (!store) {
    throw new Error(
      'useConversationStore must be used within a ConversationStoreProvider'
    )
  }
  return store
}
