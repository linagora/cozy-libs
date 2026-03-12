import { renderHook, act } from '@testing-library/react'

import { useClient } from 'cozy-client'

import useFetchConversations from './useFetchConversations'

jest.mock('cozy-client', () => ({
  useClient: jest.fn(),
  Q: jest.fn(() => ({
    getByIds: jest.fn(),
    getById: jest.fn(),
    where: jest.fn().mockReturnThis(),
    include: jest.fn().mockReturnThis(),
    indexFields: jest.fn().mockReturnThis(),
    sortBy: jest.fn().mockReturnThis(),
    offsetBookmark: jest.fn().mockReturnThis(),
    limitBy: jest.fn().mockReturnThis()
  })),
  fetchPolicies: {
    olderThan: jest.fn()
  }
}))

jest.mock(
  'cozy-minilog',
  () => () => ({
    error: jest.fn(),
    info: jest.fn()
  }),
  { virtual: true }
)

const mockClient = {
  query: jest.fn()
}

describe('useFetchConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockClient.query.mockReset()
    useClient.mockReturnValue(mockClient)
  })

  it('initializes with empty conversations and not loading', () => {
    const { result } = renderHook(() => useFetchConversations())

    expect(result.current.conversations).toEqual([])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.isLoading).toBe(true) // Starts loading immediately due to useEffect
  })

  it('fetches conversations on mount and resolves relationships', async () => {
    const mockResponse = {
      data: [
        {
          _id: 'conv1',
          relationships: { assistant: { data: { _id: 'ast1' } } }
        },
        { _id: 'conv2', relationships: {} }
      ],
      included: [{ _id: 'ast1', name: 'Mock Assistant', icon: 'mock.png' }],
      next: true,
      bookmark: 'bmk123'
    }

    mockClient.query.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useFetchConversations())

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(mockClient.query).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.bookmark).toBe('bmk123')

    // Check relationship mapping
    expect(result.current.conversations).toHaveLength(2)
    expect(result.current.conversations[0].assistant.name).toBe(
      'Mock Assistant'
    )
    // Fallback DEFAULT_ASSISTANT
    expect(result.current.conversations[1].assistant.id).toBe('ai_assistant')
  })

  it('fetchMore loads next bookmark and concatenates results', async () => {
    const firstPage = {
      data: [{ _id: 'c1' }],
      next: true,
      bookmark: 'bmk1'
    }
    const secondPage = {
      data: [{ _id: 'c2' }],
      next: false,
      bookmark: null
    }

    mockClient.query
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage)

    const { result } = renderHook(() => useFetchConversations())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    }) // wait for initial load

    expect(result.current.conversations).toHaveLength(1)
    expect(result.current.bookmark).toBe('bmk1')
    expect(result.current.hasMore).toBe(true)

    // Trigger fetchMore
    act(() => {
      result.current.fetchMore()
    })

    expect(result.current.isLoading).toBe(true)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.conversations).toHaveLength(2)
    expect(result.current.conversations[1]._id).toBe('c2')
    expect(result.current.hasMore).toBe(false)
    expect(result.current.bookmark).toBe(null)
  })

  it('handles query parameter changes gracefully by resetting state', async () => {
    const initialQuery = { title: 'First' }
    const newQuery = { title: 'Second' }

    mockClient.query.mockResolvedValue({
      data: [{ _id: 'c1' }],
      next: true,
      bookmark: 'bmk1'
    })

    const { result, rerender } = renderHook(
      ({ query }) => useFetchConversations({ query }),
      { initialProps: { query: initialQuery } }
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })
    expect(result.current.conversations).toHaveLength(1)

    // Render with new query
    mockClient.query.mockResolvedValueOnce({
      data: [{ _id: 'c2' }],
      next: false,
      bookmark: null
    })

    act(() => {
      rerender({ query: newQuery })
    })

    // It should immediately be loading and wipe state
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    // Now populated with new query results
    expect(result.current.conversations[0]._id).toBe('c2')
    expect(mockClient.query).toHaveBeenCalledTimes(2)
  })

  it('ignores stale responses using request IDs', async () => {
    // We simulate a slow response that resolves AFTER a fast response
    // First request is slow
    const slowResponsePromise = new Promise(resolve => {
      setTimeout(() => resolve({ data: [{ _id: 'stale' }], next: false }), 50)
    })

    // Second request is fast
    const fastResponsePromise = Promise.resolve({
      data: [{ _id: 'fresh' }],
      next: false
    })

    mockClient.query
      .mockReturnValueOnce(slowResponsePromise)
      .mockReturnValueOnce(fastResponsePromise)

    const { result, rerender } = renderHook(
      ({ query }) => useFetchConversations({ query }),
      { initialProps: { query: 'query1' } }
    )

    // Immediately trigger a new query
    act(() => {
      rerender({ query: 'query2' })
    })

    // Wait for the fast response to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    // Ensure it's the fresh data
    expect(result.current.conversations[0]._id).toBe('fresh')

    // Wait a bit longer for the slow response to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 60))
    })

    // Data should not have been overwritten by the stale response
    expect(result.current.conversations[0]._id).toBe('fresh')
  })
})
