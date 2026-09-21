import { renderHook } from '@testing-library/react-hooks/dom'

import { useClient } from 'cozy-client'

import { ensureAssistantsSetup } from './autoprovision'
import { useAssistantsSetup } from './useAssistantsSetup'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('./autoprovision', () => ({ ensureAssistantsSetup: jest.fn() }))

const client = { id: 'client' }

describe('useAssistantsSetup', () => {
  beforeEach(() => {
    useClient.mockReset().mockReturnValue(client)
    ensureAssistantsSetup.mockReset().mockResolvedValue(null)
  })

  it('ensures the setup with the client on mount', () => {
    const { rerender } = renderHook(() => useAssistantsSetup())
    rerender()

    expect(ensureAssistantsSetup).toHaveBeenCalledTimes(1)
    expect(ensureAssistantsSetup).toHaveBeenCalledWith(client)
  })

  it('waits for a client', () => {
    useClient.mockReturnValue(null)
    renderHook(() => useAssistantsSetup())

    expect(ensureAssistantsSetup).not.toHaveBeenCalled()
  })
})
