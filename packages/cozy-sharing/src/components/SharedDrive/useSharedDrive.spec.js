import { renderHook, act } from '@testing-library/react-hooks'

import { useSharedDrive } from './useSharedDrive'

const mockCreateSharedDrive = jest.fn()
const mockCollection = jest.fn(() => ({
  createSharedDrive: mockCreateSharedDrive
}))

jest.mock('cozy-client', () => ({
  useClient: jest.fn(() => ({
    collection: mockCollection,
    create: jest.fn()
  }))
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
    const { result } = renderHook(() => useSharedDrive())
    expect(result.current.sharedDriveName).toBe('')
    expect(result.current.pendingRecipients).toEqual([])
    expect(result.current.selectedOption).toBe('readWrite')
  })

  it('handleSharedDriveNameChange updates the name', () => {
    const { result } = renderHook(() => useSharedDrive())
    act(() => {
      result.current.handleSharedDriveNameChange({
        target: { value: 'My Drive' }
      })
    })
    expect(result.current.sharedDriveName).toBe('My Drive')
  })

  it('onCreate calls createSharedDrive', async () => {
    mockCreateSharedDrive.mockResolvedValue({})

    const { result } = renderHook(() => useSharedDrive())

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
  })
})
