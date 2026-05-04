import { renderHook, act } from '@testing-library/react-hooks'

import { useSharedDrive } from './useSharedDrive'

const mockShowAlert = jest.fn()
const mockCreateSharedDrive = jest.fn()
const mockCollection = jest.fn(() => ({
  createSharedDrive: mockCreateSharedDrive
}))
const mockT = jest.fn(key => key)

jest.mock('cozy-client', () => ({
  useClient: jest.fn(() => ({
    collection: mockCollection
  })),
  models: {
    contact: {
      getPrimaryEmail: jest.fn(r =>
        Array.isArray(r.email) && r.email[0] ? r.email[0].address : ''
      ),
      getDisplayName: jest.fn(r => r.displayName || r.name || '')
    }
  }
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: jest.fn(() => ({ showAlert: mockShowAlert }))
}))

jest.mock('twake-i18n', () => ({
  useI18n: jest.fn(() => ({ t: mockT }))
}))

jest.mock('../../models', () => ({
  Contact: { doctype: 'io.cozy.contacts' }
}))

describe('useSharedDrive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty initial state', () => {
    const { result } = renderHook(() =>
      useSharedDrive({ onSuccess: jest.fn() })
    )
    expect(result.current.sharedDriveName).toBe('')
    expect(result.current.recipients).toEqual([])
  })

  it('handleSharedDriveNameChange updates the name', () => {
    const { result } = renderHook(() =>
      useSharedDrive({ onSuccess: jest.fn() })
    )
    act(() => {
      result.current.handleSharedDriveNameChange({
        target: { value: 'My Drive' }
      })
    })
    expect(result.current.sharedDriveName).toBe('My Drive')
  })

  it('onRevoke removes a recipient from both lists', () => {
    const { result } = renderHook(() =>
      useSharedDrive({ onSuccess: jest.fn() })
    )
    act(() => {
      result.current.onShare({
        recipients: [{ _id: 'abc', displayName: 'Alice', email: [] }],
        readOnlyRecipients: []
      })
    })
    act(() => {
      result.current.onRevoke(`virtual-shared-drive-sharing-abc`)
    })
    expect(result.current.recipients).toHaveLength(0)
  })

  it('onSetType moves a recipient to read-only', () => {
    const { result } = renderHook(() =>
      useSharedDrive({ onSuccess: jest.fn() })
    )
    act(() => {
      result.current.onShare({
        recipients: [{ _id: 'abc', displayName: 'Alice', email: [] }],
        readOnlyRecipients: []
      })
    })
    act(() => {
      result.current.onSetType(`virtual-shared-drive-sharing-abc`, 'one-way')
    })
    expect(result.current.recipients[0].type).toBe('one-way')
  })

  it('onSetType moves a recipient to read-write', () => {
    const { result } = renderHook(() =>
      useSharedDrive({ onSuccess: jest.fn() })
    )
    act(() => {
      result.current.onShare({
        recipients: [],
        readOnlyRecipients: [{ _id: 'xyz', displayName: 'Bob', email: [] }]
      })
    })
    act(() => {
      result.current.onSetType(`virtual-shared-drive-sharing-xyz`, 'two-way')
    })
    expect(result.current.recipients).toHaveLength(1)
    expect(result.current.recipients[0].type).toBe('two-way')
  })

  it('onCreate calls createSharedDrive, showAlert with success, and onSuccess', async () => {
    const onSuccess = jest.fn()
    mockCreateSharedDrive.mockResolvedValue({})

    const { result } = renderHook(() => useSharedDrive({ onSuccess }))

    act(() => {
      result.current.handleSharedDriveNameChange({
        target: { value: 'My Drive' }
      })
    })

    await act(async () => {
      await result.current.onCreate()
    })

    expect(mockCreateSharedDrive).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My Drive',
        description: 'My Drive'
      })
    )
    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' })
    )
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('onCreate shows error alert and does not call onSuccess on failure', async () => {
    const onSuccess = jest.fn()
    mockCreateSharedDrive.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useSharedDrive({ onSuccess }))

    await act(async () => {
      await result.current.onCreate()
    })

    expect(mockShowAlert).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error' })
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
