import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { SharingProvider } from './SharingProvider'
import SharingContext from './context'
import reducer, { addSharingLink, getDocumentPermissions } from './state'
import AppLike from '../test/AppLike'

const AppWrapper = ({ children, client, isPublic }) => {
  return (
    <AppLike client={client}>
      <SharingProvider client={client} isPublic={isPublic}>
        {children}
      </SharingProvider>
    </AppLike>
  )
}

describe('allLoaded', () => {
  const client = createMockClient({})
  client.isLogged = true
  client.collection = () => ({
    findByDoctype: jest.fn().mockResolvedValue({
      data: []
    }),
    findLinksByDoctype: jest.fn().mockResolvedValue({
      data: []
    }),
    findApps: jest.fn().mockResolvedValue({
      data: []
    })
  })

  it('Change to True when all data is loaded', async () => {
    render(
      <AppWrapper client={client}>
        <SharingContext.Consumer>
          {({ allLoaded }) => <div>{`allLoaded: ${allLoaded}`}</div>}
        </SharingContext.Consumer>
      </AppWrapper>
    )

    expect(screen.getByText('allLoaded: false')).toBeInTheDocument()

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    expect(screen.getByText('allLoaded: true')).toBeInTheDocument()
  })
})

describe('SharingProvider', () => {
  const client = createMockClient({})

  client.plugins.realtime = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  }

  client.isLogged = true

  beforeEach(() => {
    jest.spyOn(client, 'collection').mockReturnValue({
      findByDoctype: jest.fn().mockResolvedValue({ data: [] }),
      findLinksByDoctype: jest.fn().mockResolvedValue({ data: [] }),
      findApps: jest.fn().mockResolvedValue({ data: [] })
    })
    jest
      .spyOn(SharingProvider.prototype, 'fetchAllSharings')
      .mockReturnValue(Promise.resolve())
  })
  afterEach(() => jest.resetAllMocks())

  it('loads data on mount', () => {
    render(<AppWrapper client={client} />)

    expect(client.plugins.realtime.subscribe).toHaveBeenCalled()
    expect(SharingProvider.prototype.fetchAllSharings).toHaveBeenCalled()
  })

  it('loads nothing when the client is not logged in', () => {
    client.isLogged = false
    render(<AppWrapper client={client} />)

    expect(client.plugins.realtime.subscribe).not.toHaveBeenCalled()
    expect(SharingProvider.prototype.fetchAllSharings).not.toHaveBeenCalled()

    client.emit('plugin:realtime:login')
    expect(client.plugins.realtime.subscribe).toHaveBeenCalled()
    expect(SharingProvider.prototype.fetchAllSharings).toHaveBeenCalled()
  })

  it("should not call collection's methods but always subscribe to the realtime when isPublic is true", () => {
    client.isLogged = true
    render(<AppWrapper client={client} isPublic={true} />)

    expect(SharingProvider.prototype.fetchAllSharings).toHaveBeenCalled()
    expect(client.plugins.realtime.subscribe).toHaveBeenCalled()
    expect(client.collection().findByDoctype).not.toHaveBeenCalled()
    expect(client.collection().findLinksByDoctype).not.toHaveBeenCalled()
    expect(client.collection().findApps).not.toHaveBeenCalled()
  })
})

describe('shareByLink', () => {
  const PERM_DRIVE_FILE = {
    type: 'io.cozy.permissions',
    id: 'perm_drive_file',
    attributes: {
      type: 'share',
      permissions: {
        rule0: {
          type: 'io.cozy.files',
          verbs: ['GET'],
          values: ['file_in_drive']
        }
      },
      shortcodes: { code: 'shortcode123' }
    }
  }

  const driveFile = {
    _id: 'file_in_drive',
    id: 'file_in_drive',
    driveId: 'drive_123'
  }

  it('dispatches addSharingLink exactly once for a shared drive file', async () => {
    const mockCreateSharingLink = jest
      .fn()
      .mockResolvedValue({ data: PERM_DRIVE_FILE })
    const mockClient = createMockClient({})
    mockClient.collection = jest.fn().mockReturnValue({
      createSharingLink: mockCreateSharingLink
    })

    const provider = new SharingProvider({ client: mockClient })
    provider.state = reducer()
    provider.dispatch = jest.fn(action => {
      provider.state = reducer(provider.state, action)
    })

    await provider.shareByLink(driveFile, { verbs: ['GET'] })

    expect(provider.dispatch).toHaveBeenCalledTimes(1)
    const permissions = getDocumentPermissions(provider.state, driveFile._id)
    expect(permissions).toHaveLength(1)
    expect(permissions[0].id).toBe(PERM_DRIVE_FILE.id)
  })

  it('dispatches addSharingLink once for a regular file (non shared drive)', async () => {
    const PERM_REGULAR_FILE = {
      type: 'io.cozy.permissions',
      id: 'perm_regular_file',
      attributes: {
        type: 'share',
        permissions: {
          rule0: {
            type: 'io.cozy.files',
            verbs: ['GET'],
            values: ['regular_file_id']
          }
        },
        shortcodes: { code: 'shortcode456' }
      }
    }
    const regularFile = { _id: 'regular_file_id', id: 'regular_file_id' }
    const mockCreateSharingLink = jest
      .fn()
      .mockResolvedValue({ data: PERM_REGULAR_FILE })
    const mockClient = createMockClient({})
    mockClient.collection = jest.fn().mockReturnValue({
      createSharingLink: mockCreateSharingLink
    })

    const provider = new SharingProvider({ client: mockClient })
    provider.state = reducer()
    provider.permissionCol = { createSharingLink: mockCreateSharingLink }
    provider.dispatch = jest.fn(action => {
      provider.state = reducer(provider.state, action)
    })

    await provider.shareByLink(regularFile, { verbs: ['GET'] })

    expect(provider.dispatch).toHaveBeenCalledTimes(1)
    const permissions = getDocumentPermissions(provider.state, regularFile._id)
    expect(permissions).toHaveLength(1)
    expect(permissions[0].id).toBe(PERM_REGULAR_FILE.id)
  })
})

describe('revokeSharingLink', () => {
  const PERM = {
    type: 'io.cozy.permissions',
    id: 'perm_1',
    attributes: {
      type: 'share',
      permissions: {
        rule0: { type: 'io.cozy.files', verbs: ['GET'], values: ['file_id'] }
      }
    }
  }

  let provider
  let mockDestroy

  beforeEach(() => {
    mockDestroy = jest.fn().mockResolvedValue({})
    const mockClient = createMockClient({})
    mockClient.getStackClient = () => ({ uri: 'http://cozy.local' })
    mockClient.collection = jest.fn().mockReturnValue({ destroy: mockDestroy })
    provider = new SharingProvider({ client: mockClient })
    provider.state = reducer(undefined, addSharingLink(PERM))
    provider.dispatch = jest.fn(action => {
      provider.state = reducer(provider.state, action)
    })
  })

  it('uses permissionCol.destroy for a regular file', async () => {
    const regularFile = { _id: 'file_id', id: 'file_id' }
    provider.permissionCol = { destroy: mockDestroy }

    await provider.revokeSharingLink(regularFile)

    expect(mockDestroy).toHaveBeenCalledTimes(1)
    expect(mockDestroy).toHaveBeenCalledWith(PERM)
    expect(provider.dispatch).toHaveBeenCalledTimes(1)
  })

  it('uses drivePermissionCollection.destroy for a shared drive file', async () => {
    const driveFile = { _id: 'file_id', id: 'file_id', driveId: 'drive_123' }
    const mockDriveCollection = { destroy: mockDestroy }
    provider.props.client.collection = jest
      .fn()
      .mockReturnValue(mockDriveCollection)

    await provider.revokeSharingLink(driveFile)

    expect(provider.props.client.collection).toHaveBeenCalledWith(
      'io.cozy.permissions',
      { driveId: 'drive_123' }
    )
    expect(mockDestroy).toHaveBeenCalledTimes(1)
    expect(mockDestroy).toHaveBeenCalledWith(PERM)
    expect(provider.dispatch).toHaveBeenCalledTimes(1)
  })
})

describe('updateDocumentPermissions', () => {
  const PERM_DRIVE_FILE = {
    type: 'io.cozy.permissions',
    id: 'perm_drive_file',
    attributes: {
      type: 'share',
      permissions: {
        rule0: {
          type: 'io.cozy.files',
          verbs: ['GET'],
          values: ['file_in_drive']
        }
      },
      shortcodes: { code: 'shortcode123' }
    }
  }

  it('sends only one PATCH request for a shared drive file', async () => {
    const driveFile = {
      _id: 'file_in_drive',
      id: 'file_in_drive',
      driveId: 'drive_123'
    }
    const mockAdd = jest.fn().mockResolvedValue({ data: PERM_DRIVE_FILE })
    const mockClient = createMockClient({})
    mockClient.collection = jest.fn().mockReturnValue({ add: mockAdd })

    const provider = new SharingProvider({ client: mockClient })
    // Seed the state with exactly one permission (as it would be after a correct shareByLink)
    provider.state = reducer(undefined, addSharingLink(PERM_DRIVE_FILE))
    provider.dispatch = jest.fn()

    await provider.updateDocumentPermissions(driveFile, {
      verbs: ['GET'],
      expiresAt: '',
      password: ''
    })

    expect(mockAdd).toHaveBeenCalledTimes(1)
  })
})

describe('updateSharingMemberType', () => {
  const mockContact = { _id: 'contact-1', email: [{ address: 'bob@bob.cozy' }] }
  const mockSharing = {
    id: 'sharing-123',
    type: 'io.cozy.sharings',
    attributes: {
      members: [
        { status: 'owner', email: 'owner@cozy.local' },
        { status: 'ready', email: 'bob@bob.cozy' }
      ]
    }
  }

  let instance
  let mockContactsCollection

  beforeEach(() => {
    mockContactsCollection = {
      find: jest.fn().mockResolvedValue({ data: [mockContact] })
    }

    const mockClient = {
      getStackClient: () => ({ uri: 'http://cozy.local' }),
      collection: jest.fn().mockReturnValue(mockContactsCollection)
    }

    instance = new SharingProvider({ client: mockClient })
    instance.state = {
      ...instance.state,
      sharings: [mockSharing]
    }
    instance.sharingCol = {
      revokeRecipient: jest.fn().mockResolvedValue({})
    }
    jest.spyOn(instance, 'addRecipients').mockResolvedValue({})
  })

  it('should throw when sharing is not found', async () => {
    await expect(
      instance.updateSharingMemberType('unknown-id', 1, 'one-way')
    ).rejects.toThrow('Sharing not found')
  })

  it('should throw when member is not found', async () => {
    await expect(
      instance.updateSharingMemberType('sharing-123', 99, 'one-way')
    ).rejects.toThrow('Member not found')
  })

  it('should throw when contact is not found', async () => {
    mockContactsCollection.find.mockResolvedValue({ data: [] })

    await expect(
      instance.updateSharingMemberType('sharing-123', 1, 'one-way')
    ).rejects.toThrow('Contact not found')
  })

  it('should revoke and re-add with readOnly when switching to one-way', async () => {
    await instance.updateSharingMemberType('sharing-123', 1, 'one-way')

    expect(instance.sharingCol.revokeRecipient).toHaveBeenCalledWith(
      mockSharing,
      1
    )
    expect(instance.addRecipients).toHaveBeenCalledWith({
      document: mockSharing,
      recipients: [],
      readOnlyRecipients: [mockContact]
    })
  })

  it('should revoke and re-add as read-write when switching to two-way', async () => {
    await instance.updateSharingMemberType('sharing-123', 1, 'two-way')

    expect(instance.sharingCol.revokeRecipient).toHaveBeenCalledWith(
      mockSharing,
      1
    )
    expect(instance.addRecipients).toHaveBeenCalledWith({
      document: mockSharing,
      recipients: [mockContact],
      readOnlyRecipients: []
    })
  })

  it('should rethrow error if addRecipients fails after revocation', async () => {
    instance.addRecipients.mockRejectedValue(new Error('Network error'))

    await expect(
      instance.updateSharingMemberType('sharing-123', 1, 'one-way')
    ).rejects.toThrow('Network error')
  })
})

// TODO Convert with react-testing-library
// describe('hasWriteAccess', () => {
//   it('tells if a doc is writtable', () => {
//     const client = createMockClient({})
//     client.stackClient.uri = 'http://cozy.tools:8080'

//     const component = mount(
//       <AppWrapper client={client}>
//         <SharingContext.Consumer>
//           {({ hasWriteAccess }) => (
//             <>
//               <div data-id="no-sharing">
//                 {hasWriteAccess('no-sharing') ? 'yes' : 'no'}
//               </div>
//               <div data-id="owner-doc">
//                 {hasWriteAccess('owner-doc') ? 'yes' : 'no'}
//               </div>
//               <div data-id="synced-doc">
//                 {hasWriteAccess('synced-doc') ? 'yes' : 'no'}
//               </div>
//               <div data-id="read-only-doc">
//                 {hasWriteAccess('read-only-doc') ? 'yes' : 'no'}
//               </div>
//             </>
//           )}
//         </SharingContext.Consumer>
//       </AppWrapper>
//     )

//     expect(component.find('div[data-id="no-sharing"]').text()).toBe('yes')
//     expect(component.find('div[data-id="owner-doc"]').text()).toBe('yes')
//     expect(component.find('div[data-id="synced-doc"]').text()).toBe('yes')
//     expect(component.find('div[data-id="read-only-doc"]').text()).toBe('yes')

//     const provider = component.find(SharingProvider)
//     provider.instance().dispatch(
//       receiveSharings({
//         sharings: [
//           {
//             id: '123',
//             type: 'io.cozy.sharings',
//             attributes: {
//               owner: true,
//               members: [
//                 { read_only: false, instance: 'http://cozy.tools:8080' }
//               ],
//               rules: [{ values: ['owner-doc'] }]
//             }
//           },
//           {
//             id: '456',
//             type: 'io.cozy.sharings',
//             attributes: {
//               owner: false,
//               members: [
//                 { read_only: false, instance: 'http://cozy.tools:8080' }
//               ],
//               rules: [
//                 { values: ['synced-doc'], update: 'sync', remove: 'sync' }
//               ]
//             }
//           },
//           {
//             id: '789',
//             type: 'io.cozy.sharings',
//             attributes: {
//               owner: false,
//               members: [
//                 { read_only: true, instance: 'http://cozy.tools:8080' }
//               ],
//               rules: [{ values: ['read-only-doc'] }]
//             }
//           }
//         ]
//       })
//     )

//     component.update()

//     expect(component.find('div[data-id="no-sharing"]').text()).toBe('yes')
//     expect(component.find('div[data-id="owner-doc"]').text()).toBe('yes')
//     expect(component.find('div[data-id="synced-doc"]').text()).toBe('yes')
//     expect(component.find('div[data-id="read-only-doc"]').text()).toBe('no')
//   })
// })
