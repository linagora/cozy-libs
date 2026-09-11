import { renderHook } from '@testing-library/react-hooks/dom'

import { useQuery } from 'cozy-client'

import { getDefaultProvisionedAssistantId } from './provisioning'
import { useDefaultAssistantId } from './useDefaultAssistantId'

jest.mock('cozy-client', () => ({
  useQuery: jest.fn(),
  // queries.js computes its default fetch policy at import time.
  fetchPolicies: { olderThan: jest.fn(() => 'mock-fetch-policy') },
  Q: jest.fn(() => ({
    getById: jest.fn(() => ({ include: jest.fn(() => 'mock-definition') }))
  }))
}))
jest.mock('./provisioning', () => ({
  getDefaultProvisionedAssistantId: jest.fn()
}))

describe('useDefaultAssistantId', () => {
  beforeEach(() => {
    useQuery.mockReset().mockReturnValue({ data: null, fetchStatus: 'pending' })
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

  it('queries the default assistant by id', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    renderHook(() => useDefaultAssistantId())
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        as: 'io.cozy.ai.chat.assistants/docs',
        enabled: true
      })
    )
  })

  it('returns undefined while the document is being checked', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({ data: null, fetchStatus: 'loading' })
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBeUndefined()
  })

  it('returns the id once its document is loaded', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({ data: { _id: 'docs' }, fetchStatus: 'loaded' })
    const { result } = renderHook(() => useDefaultAssistantId())
    expect(result.current).toBe('docs')
  })

  it('returns null when the document is missing', () => {
    getDefaultProvisionedAssistantId.mockReturnValue('docs')
    useQuery.mockReturnValue({ data: null, fetchStatus: 'failed' })
    expect(renderHook(() => useDefaultAssistantId()).result.current).toBeNull()
    useQuery.mockReturnValue({ data: null, fetchStatus: 'loaded' })
    expect(renderHook(() => useDefaultAssistantId()).result.current).toBeNull()
  })
})
