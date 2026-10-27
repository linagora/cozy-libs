import { renderHook } from '@testing-library/react-hooks'

import { useResolveRecipients } from './useResolveRecipients'
import { getOrCreateFromArray } from '../helpers/contacts'

const mockClient = { create: jest.fn() }

jest.mock('cozy-client', () => ({
  useClient: () => mockClient
}))

jest.mock('../helpers/contacts', () => ({
  getOrCreateFromArray: jest.fn()
}))

const contacts = [{ _id: 'alice' }, { _id: 'bob' }]

describe('useResolveRecipients', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getOrCreateFromArray.mockResolvedValue(contacts)
  })

  it('gives read-write rights by default', async () => {
    const { result } = renderHook(() => useResolveRecipients())

    const resolved = await result.current([{ email: 'alice@cozy.cc' }])

    expect(resolved).toEqual({ recipients: contacts, readOnlyRecipients: [] })
  })

  it('gives read-only rights when the read-only option is selected', async () => {
    const { result } = renderHook(() => useResolveRecipients())

    const resolved = await result.current([], 'readOnly')

    expect(resolved).toEqual({ recipients: [], readOnlyRecipients: contacts })
  })

  it('creates missing contacts with the client by default', async () => {
    const { result } = renderHook(() => useResolveRecipients())
    const pendingRecipients = [{ email: 'alice@cozy.cc' }]

    await result.current(pendingRecipients)
    const createContact = getOrCreateFromArray.mock.calls[0][2]
    createContact({ email: [{ address: 'alice@cozy.cc' }] })

    expect(getOrCreateFromArray).toHaveBeenCalledWith(
      mockClient,
      pendingRecipients,
      expect.any(Function)
    )
    expect(mockClient.create).toHaveBeenCalledWith('io.cozy.contacts', {
      email: [{ address: 'alice@cozy.cc' }]
    })
  })

  it('creates missing contacts with the given function', async () => {
    const { result } = renderHook(() => useResolveRecipients())
    const createContact = jest.fn()

    await result.current([], 'readWrite', createContact)

    expect(getOrCreateFromArray).toHaveBeenCalledWith(
      mockClient,
      [],
      createContact
    )
  })
})
