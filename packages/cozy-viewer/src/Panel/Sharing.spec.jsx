import { render } from '@testing-library/react'
import React from 'react'

import Sharing from './Sharing'

const mockGetRecipientsFromSharing = jest.fn()
const mockUseClient = jest.fn()
const mockUseShareModal = jest.fn()
const mockUseSharingContext = jest.fn()
const mockMemberRecipientLite = jest.fn(({ recipient, isOwner }) => (
  <div data-testid="member-recipient" data-is-owner={String(isOwner)}>
    {recipient.name}
  </div>
))

jest.mock('cozy-client', () => ({
  useClient: () => mockUseClient()
}))

jest.mock('cozy-flags', () => jest.fn(() => false))
jest.mock('cozy-sharing', () => ({
  getRecipientsFromSharing: (...args) => mockGetRecipientsFromSharing(...args),
  LinkRecipientLite: () => <div data-testid="link-recipient" />,
  MemberRecipientLite: props => mockMemberRecipientLite(props),
  OwnerRecipientDefaultLite: () => (
    <div data-testid="owner-recipient-default" />
  ),
  useSharingContext: () => mockUseSharingContext()
}))

jest.mock('../hoc/withViewerLocales', () => ({
  withViewerLocales: Component => props => (
    <Component {...props} t={key => key} />
  )
}))

jest.mock('../providers/ShareModalProvider', () => ({
  useShareModal: () => mockUseShareModal()
}))

const file = { _id: 'file-id' }
const sharedFile = { _id: 'shared-file-id' }
const sharedDriveFile = { _id: 'file-id', driveId: 'drive-id' }
const ownerRecipient = {
  index: 'recipient-0',
  name: 'Alice',
  status: 'owner',
  instance: 'http://alice.localhost:8080/'
}
const expectedOwnerRecipient = {
  name: ownerRecipient.name,
  status: ownerRecipient.status,
  instance: ownerRecipient.instance
}
const sharedDriveSharing = {
  id: 'drive-id',
  attributes: {
    drive: true,
    members: [ownerRecipient]
  }
}

const setup = ({
  clientUri = 'http://bob.localhost:8080/',
  targetFile = file,
  userIsOwner = true
} = {}) => {
  const getDocumentPermissions = jest
    .fn()
    .mockImplementation(docId => (docId === 'file-id' ? ['perm'] : []))
  const getSharingById = jest
    .fn()
    .mockImplementation(id => (id === 'drive-id' ? sharedDriveSharing : null))
  const getRecipients = jest.fn().mockImplementation(docId => {
    if (docId === 'file-id' || docId === 'shared-file-id') {
      return [ownerRecipient]
    }

    return []
  })
  const getSharingLink = jest
    .fn()
    .mockImplementation(docId =>
      docId === 'file-id' ? 'http://share-link' : null
    )

  mockGetRecipientsFromSharing.mockReturnValue([ownerRecipient])
  mockUseClient.mockReturnValue({ options: { uri: clientUri } })
  const isOwner = jest.fn().mockReturnValue(userIsOwner)

  mockUseShareModal.mockReturnValue({ setShowShareModal: jest.fn() })
  mockUseSharingContext.mockReturnValue({
    allLoaded: true,
    getDocumentPermissions,
    getSharingById,
    getRecipients,
    getSharingLink,
    isOwner
  })

  return render(<Sharing file={targetFile} />)
}

describe('Sharing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use shared drive recipients when the file belongs to a shared drive', () => {
    setup({ targetFile: sharedDriveFile })

    expect(mockUseSharingContext().getSharingById).toHaveBeenCalledWith(
      'drive-id'
    )
    expect(mockGetRecipientsFromSharing).toHaveBeenCalledWith(
      sharedDriveSharing,
      'file-id'
    )
    expect(mockUseSharingContext().getRecipients).not.toHaveBeenCalled()
    expect(mockUseSharingContext().getDocumentPermissions).toHaveBeenCalledWith(
      'file-id'
    )
    expect(mockUseSharingContext().getSharingLink).toHaveBeenCalledWith(
      'file-id'
    )
    expect(mockUseSharingContext().isOwner).not.toHaveBeenCalled()
    expect(mockMemberRecipientLite).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: expect.objectContaining(expectedOwnerRecipient),
        isOwner: false
      })
    )
  })

  it('should use isOwner for a regular sharing', () => {
    setup({ targetFile: sharedFile, userIsOwner: true })

    expect(mockUseSharingContext().isOwner).toHaveBeenCalledWith(
      'shared-file-id'
    )
    expect(mockMemberRecipientLite).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: expect.objectContaining(expectedOwnerRecipient),
        isOwner: true
      })
    )
  })

  it('should not mark the owner as current user when the owner is remote', () => {
    setup({ targetFile: sharedDriveFile })

    expect(mockMemberRecipientLite).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: expect.objectContaining(expectedOwnerRecipient),
        isOwner: false
      })
    )
  })

  it('should mark the owner as current user when the owner matches the current instance', () => {
    setup({ clientUri: ownerRecipient.instance, targetFile: sharedDriveFile })

    expect(mockMemberRecipientLite).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: expect.objectContaining(expectedOwnerRecipient),
        isOwner: true
      })
    )
  })
})
