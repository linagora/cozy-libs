/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/globals */
import { render, act } from '@testing-library/react'
import React from 'react'

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

jest.mock('cozy-realtime/dist/useRealtime', () => jest.fn())

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
    let hookResult = {}
    const TestComponent = () => {
      hookResult.current = useFetchConversations()
      return null
    }
    act(() => {
      render(<TestComponent />)
    })

    expect(hookResult.current.conversations).toEqual([])
    expect(hookResult.current.hasMore).toBe(false)
    expect(hookResult.current.isLoading).toBe(true) // Starts loading immediately due to useEffect
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

    let hookResult = {}
    const TestComponent = () => {
      hookResult.current = useFetchConversations()
      return null
    }
    act(() => {
      render(<TestComponent />)
    })

    expect(hookResult.current.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(mockClient.query).toHaveBeenCalledTimes(1)
    expect(hookResult.current.isLoading).toBe(false)
    expect(hookResult.current.hasMore).toBe(true)
    expect(hookResult.current.bookmark).toBe('bmk123')

    // Check relationship mapping
    expect(hookResult.current.conversations).toHaveLength(2)
    expect(hookResult.current.conversations[0].assistant.name).toBe(
      'Mock Assistant'
    )
    // Fallback DEFAULT_ASSISTANT
    expect(hookResult.current.conversations[1].assistant._id).toBe(
      'default_ai_assistant'
    )
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

    let hookResult = {}
    const TestComponent = () => {
      hookResult.current = useFetchConversations()
      return null
    }
    act(() => {
      render(<TestComponent />)
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    }) // wait for initial load

    expect(hookResult.current.conversations).toHaveLength(1)
    expect(hookResult.current.bookmark).toBe('bmk1')
    expect(hookResult.current.hasMore).toBe(true)

    // Trigger fetchMore
    act(() => {
      hookResult.current.fetchMore()
    })

    expect(hookResult.current.isLoading).toBe(true)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(hookResult.current.conversations).toHaveLength(2)
    expect(hookResult.current.conversations[1]._id).toBe('c2')
    expect(hookResult.current.hasMore).toBe(false)
    expect(hookResult.current.bookmark).toBe(null)
  })

  it('handles query parameter changes gracefully by resetting state', async () => {
    const initialQuery = { title: 'First' }
    const newQuery = { title: 'Second' }

    mockClient.query.mockResolvedValue({
      data: [{ _id: 'c1' }],
      next: true,
      bookmark: 'bmk1'
    })

    let hookResult
    const TestComponent = ({ query }) => {
      hookResult = useFetchConversations({ query })
      return null
    }

    let rerender
    act(() => {
      const utils = render(<TestComponent query={initialQuery} />)
      rerender = utils.rerender
    })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })
    expect(hookResult.conversations).toHaveLength(1)

    // Render with new query
    mockClient.query.mockResolvedValueOnce({
      data: [{ _id: 'c2' }],
      next: false,
      bookmark: null
    })

    act(() => {
      rerender(<TestComponent query={newQuery} />)
    })

    // It should immediately be loading and wipe state
    expect(hookResult.isLoading).toBe(true)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    // Now populated with new query results
    expect(hookResult.conversations[0]._id).toBe('c2')
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

    let hookResult
    const TestComponent = ({ query }) => {
      hookResult = useFetchConversations({ query })
      return null
    }

    let rerender
    act(() => {
      const utils = render(<TestComponent query="query1" />)
      rerender = utils.rerender
    })

    // Immediately trigger a new query
    act(() => {
      rerender(<TestComponent query="query2" />)
    })

    // Wait for the fast response to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    // Ensure it's the fresh data
    expect(hookResult.conversations[0]._id).toBe('fresh')

    // Wait a bit longer for the slow response to resolve
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 60))
    })

    // Data should not have been overwritten by the stale response
    expect(hookResult.conversations[0]._id).toBe('fresh')
  })
})
