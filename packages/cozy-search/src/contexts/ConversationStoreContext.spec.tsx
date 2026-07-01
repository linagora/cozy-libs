import { render, screen } from '@testing-library/react'
import React from 'react'

import {
  ConversationStoreProvider,
  useConversationStore
} from './ConversationStoreContext'
import type { ConversationStore } from './ConversationStore'

const Probe = (): React.ReactElement => {
  const store = useConversationStore()
  return <div>{store.useConversations().conversations.length} convs</div>
}

const fakeStore: ConversationStore = {
  useConversations: () => ({
    conversations: [{ _id: 'a' }, { _id: 'b' }],
    hasMore: false,
    isLoading: false,
    fetchMore: (): void => {}
  }),
  useConversationMessages: () => ({ messages: [], isLoading: false }),
  createConversation: () => Promise.resolve('new'),
  deleteConversation: () => Promise.resolve(),
  renameConversation: () => Promise.resolve()
}

describe('ConversationStoreContext', () => {
  it('exposes the injected store to consumers', () => {
    render(
      <ConversationStoreProvider store={fakeStore}>
        <Probe />
      </ConversationStoreProvider>
    )
    expect(screen.getByText('2 convs')).toBeTruthy()
  })

  it('throws when used without a provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/ConversationStoreProvider/)
    spy.mockRestore()
  })
})
