import { render } from '@testing-library/react'
import React from 'react'

const mockClient = {
  query: jest
    .fn()
    .mockResolvedValue({ data: [], included: [], bookmark: null }),
  stackClient: { fetchJSON: jest.fn() },
  destroy: jest.fn(),
  save: jest.fn()
}

jest.mock('cozy-client', () => ({
  useClient: jest.fn(() => mockClient),
  useQuery: jest.fn(() => ({ data: undefined, fetchStatus: 'loaded' })),
  isQueryLoading: jest.fn(() => false),
  Q: jest.fn(() => ({
    getById: jest.fn(() => ({})),
    where: jest.fn(() => ({
      indexFields: jest.fn(() => ({
        sortBy: jest.fn(() => ({
          include: jest.fn(() => ({
            offsetBookmark: jest.fn(() => ({
              limitBy: jest.fn(() => ({}))
            }))
          }))
        }))
      }))
    }))
  })),
  fetchPolicies: {
    olderThan: jest.fn(() => ({}))
  }
}))
jest.mock('cozy-realtime/dist/useRealtime', () => ({
  __esModule: true,
  default: (): void => {}
}))
jest.mock('../../hooks/useFetchConversations', () =>
  jest.fn(() => ({
    conversations: [],
    hasMore: false,
    isLoading: false,
    fetchMore: jest.fn()
  }))
)

import { useCozyConversationStore } from './CozyConversationStore'

describe('CozyConversationStore', () => {
  it('implements the ConversationStore surface', () => {
    let store: ReturnType<typeof useCozyConversationStore> | undefined
    const TestComponent = (): null => {
      // eslint-disable-next-line react-hooks/globals -- test helper captures hook result outside component for assertion
      store = useCozyConversationStore()
      return null
    }
    render(<TestComponent />)

    expect(typeof store!.useConversations).toBe('function')
    expect(typeof store!.useConversationMessages).toBe('function')
    expect(typeof store!.createConversation).toBe('function')
    expect(typeof store!.deleteConversation).toBe('function')
    expect(typeof store!.renameConversation).toBe('function')
  })

  it('creates a conversation id without touching the stack', async () => {
    let store: ReturnType<typeof useCozyConversationStore> | undefined
    const TestComponent = (): null => {
      // eslint-disable-next-line react-hooks/globals -- test helper captures hook result outside component for assertion
      store = useCozyConversationStore()
      return null
    }
    render(<TestComponent />)

    const id = await store!.createConversation()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    // The id is minted locally; no request must hit the stack on create.
    expect(mockClient.stackClient.fetchJSON).not.toHaveBeenCalled()
    expect(mockClient.query).not.toHaveBeenCalled()
    expect(mockClient.save).not.toHaveBeenCalled()
    expect(mockClient.destroy).not.toHaveBeenCalled()
  })

  it('destroys with the current _rev fetched from the stack', async () => {
    let store: ReturnType<typeof useCozyConversationStore> | undefined
    const TestComponent = (): null => {
      // eslint-disable-next-line react-hooks/globals -- test helper captures hook result outside component for assertion
      store = useCozyConversationStore()
      return null
    }
    render(<TestComponent />)

    mockClient.query.mockResolvedValueOnce({
      data: { _id: 'conv-1', _rev: '2-abc' }
    })
    await store!.deleteConversation('conv-1')

    expect(mockClient.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'conv-1', _rev: '2-abc' })
    )
  })

  it('saves the renamed conversation with the current _rev', async () => {
    let store: ReturnType<typeof useCozyConversationStore> | undefined
    const TestComponent = (): null => {
      // eslint-disable-next-line react-hooks/globals -- test helper captures hook result outside component for assertion
      store = useCozyConversationStore()
      return null
    }
    render(<TestComponent />)

    mockClient.query.mockResolvedValueOnce({
      data: { _id: 'conv-1', _rev: '2-abc', name: 'old' }
    })
    await store!.renameConversation('conv-1', 'new name')

    expect(mockClient.save).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'conv-1', _rev: '2-abc', name: 'new name' })
    )
  })
})
