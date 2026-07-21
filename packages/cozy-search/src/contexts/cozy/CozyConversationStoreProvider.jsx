import React from 'react'

import { ConversationStoreProvider } from '../ConversationStoreContext'
import { useCozyConversationStore } from './CozyConversationStore'

const CozyConversationStoreProvider = ({ children }) => {
  const store = useCozyConversationStore()
  return (
    <ConversationStoreProvider store={store}>
      {children}
    </ConversationStoreProvider>
  )
}

export default CozyConversationStoreProvider
