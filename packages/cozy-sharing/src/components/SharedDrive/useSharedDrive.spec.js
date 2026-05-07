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
    collection: mockCollection,
    create: jest.fn()
  }))
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

jest.mock('../../helpers/contacts', () => ({
  getOrCreateFromArray: jest.fn((client, recipients) =>
    Promise.resolve(recipients)
  )
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
    expect(result.current.pendingRecipients).toEqual([])
    expect(result.current.selectedOption).toBe('readWrite')
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

  it('onCreate calls createSharedDrive and onSuccess', async () => {
    const onSuccess = jest.fn()
    mockCreateSharedDrive.mockResolvedValue({})

    const { result } = renderHook(() => useSharedDrive({ onSuccess }))

    act(() => {
      result.current.handleSharedDriveNameChange({
        target: { value: 'My Drive' }
      })
      result.current.setPendingRecipients([{ email: 'a@b.c' }])
    })

    await act(async () => {
      await result.current.onCreate()
    })

    expect(mockCreateSharedDrive).toHaveBeenCalledWith({
      name: 'My Drive',
      description: 'My Drive',
      recipients: [{ email: 'a@b.c' }],
      readOnlyRecipients: []
    })
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
