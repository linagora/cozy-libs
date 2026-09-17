import { renderHook } from '@testing-library/react-hooks/dom'

import { useClient } from 'cozy-client'

import { autoprovisionAssistants } from './autoprovision'
import { useAssistantsAutoprovision } from './useAssistantsAutoprovision'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('./autoprovision', () => ({ autoprovisionAssistants: jest.fn() }))

describe('useAssistantsAutoprovision', () => {
  beforeEach(() => {
    useClient.mockReset()
    autoprovisionAssistants.mockReset().mockResolvedValue(null)
  })

  it('provisions with the client on mount', () => {
    const client = { id: 'client' }
    useClient.mockReturnValue(client)
    const { rerender } = renderHook(() => useAssistantsAutoprovision())
    rerender()

    expect(autoprovisionAssistants).toHaveBeenCalledTimes(1)
    expect(autoprovisionAssistants).toHaveBeenCalledWith(client)
  })

  it('waits for a client', () => {
    useClient.mockReturnValue(null)
    renderHook(() => useAssistantsAutoprovision())

    expect(autoprovisionAssistants).not.toHaveBeenCalled()
  })
})
