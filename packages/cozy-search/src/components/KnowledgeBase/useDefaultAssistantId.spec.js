import { renderHook } from '@testing-library/react-hooks/dom'

import { useQuery } from 'cozy-client'

import { getDefaultProvisionedAssistantId } from './provisioning'
import { useDefaultAssistantId } from './useDefaultAssistantId'

jest.mock('cozy-client', () => ({
  useQuery: jest.fn(),
  // queries.js computes its default fetch policy at import time.
  fetchPolicies: { olderThan: jest.fn(() => 'mock-fetch-policy') }
}))
jest.mock('./provisioning', () => ({
  getDefaultProvisionedAssistantId: jest.fn()
}))

describe('useDefaultAssistantId', () => {
  beforeEach(() => {
    useQuery.mockReset().mockReturnValue({ data: [], fetchStatus: 'pending' })
    getDefaultProvisionedAssistantId.mockReset()
  })

  it('returns null and disables the query without a configured default', () => {
    getDefaultProvisionedAssistantId.mockReturnValue(null)
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBeNull()
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )
  })

  it('returns null while the assistants list is loading', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({ data: [], fetchStatus: 'loading' })
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBeNull()
  })

  it('returns the id once loaded and present in the list', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({
      data: [{ _id: 'docs' }, { _id: 'other' }],
      fetchStatus: 'loaded'
    })
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBe('docs')
  })

  it('returns null when loaded but the document is absent', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({
      data: [{ _id: 'other' }],
      fetchStatus: 'loaded'
    })
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBeNull()
  })
})
