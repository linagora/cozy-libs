import { renderHook } from '@testing-library/react-hooks/dom'

import { useClient } from 'cozy-client'

import { autoprovisionEntries, ensureRagIndexTriggers } from './autoprovision'
import { useRagIndexTriggers } from './useRagIndexTriggers'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('./autoprovision', () => ({
  autoprovisionEntries: jest.fn(),
  ensureRagIndexTriggers: jest.fn()
}))

const client = { id: 'client' }

describe('useRagIndexTriggers', () => {
  beforeEach(() => {
    useClient.mockReset().mockReturnValue(client)
    autoprovisionEntries.mockReset().mockReturnValue([{ name: 'Docs' }])
    ensureRagIndexTriggers.mockReset().mockResolvedValue({
      triggers: [],
      error: null
    })
  })

  it('ensures the triggers with the client on mount', () => {
    const { rerender } = renderHook(() => useRagIndexTriggers())
    rerender()

    expect(ensureRagIndexTriggers).toHaveBeenCalledTimes(1)
    expect(ensureRagIndexTriggers).toHaveBeenCalledWith(client)
  })

  it('does nothing without flag entries', () => {
    autoprovisionEntries.mockReturnValue(null)
    renderHook(() => useRagIndexTriggers())

    expect(ensureRagIndexTriggers).not.toHaveBeenCalled()
  })

  it('waits for a client', () => {
    useClient.mockReturnValue(null)
    renderHook(() => useRagIndexTriggers())

    expect(ensureRagIndexTriggers).not.toHaveBeenCalled()
  })
})
