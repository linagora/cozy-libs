import { act, fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { FederatedFolderModal } from './FederatedFolderModal'
import { getOrCreateFromArray } from '../../helpers/contacts'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import AppLike from '../SharingBanner/test/AppLike'

const mockShare = jest.fn()
const mockShareByLink = jest.fn()
const mockRevoke = jest.fn()
const mockGetSharingLink = jest.fn()
const mockGetFederatedShareLink = jest.fn()
const mockGetRecipients = jest.fn().mockReturnValue([])
const mockGetSharingById = jest.fn()
const mockHasSharedChild = jest.fn()
const mockHasSharedParent = jest.fn()
const mockFetchSharedDriveSharingLinks = jest.fn()
const mockGetDocumentPermissions = jest.fn().mockReturnValue([])
const mockShowAlert = jest.fn()
const mockOnClose = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    share: mockShare,
    shareByLink: mockShareByLink,
    revoke: mockRevoke,
    getSharingLink: mockGetSharingLink,
    getFederatedShareLink: mockGetFederatedShareLink,
    getDocumentPermissions: mockGetDocumentPermissions,
    fetchSharedDriveSharingLinks: mockFetchSharedDriveSharingLinks,
    getOwner: jest.fn(),
    getRecipients: mockGetRecipients,
    getSharedParentPath: jest.fn().mockReturnValue(null),
    getSharingById: mockGetSharingById,
    hasSharedChild: mockHasSharedChild,
    hasSharedParent: mockHasSharedParent
  })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({
    showAlert: mockShowAlert
  })
}))

jest.mock('../../hoc/withLocales', () => Component => Component)

jest.mock('../../helpers/contacts', () => ({
  getOrCreateFromArray: jest.fn()
}))

jest.mock('../../hooks/usePendingRecipients', () => ({
  usePendingRecipients: jest.fn()
}))

jest.mock('../ShareByLink', () => () => <button>Copy link</button>)

const mockDocument = {
  _id: 'folder-123',
  name: 'My Test Folder',
  path: '/test/folder'
}

const createSharingContextValue = () => ({
  refresh: jest.fn(),
  hasWriteAccess: jest.fn(),
  getRecipients: jest.fn(),
  getSharingLink: mockGetSharingLink,
  getDocumentPermissions: mockGetDocumentPermissions,
  fetchSharedDriveSharingLinks: mockFetchSharedDriveSharingLinks,
  share: mockShare
})

const createTestClient = () => {
  const client = createMockClient({
    queries: {
      'io.cozy.contacts/reachable': {
        doctype: 'io.cozy.contacts',
        data: []
      },
      'io.cozy.contacts/groups': {
        doctype: 'io.cozy.contacts.groups',
        data: []
      },
      'io.cozy.contacts/unreachable-with-groups': {
        doctype: 'io.cozy.contacts',
        data: []
      }
    }
  })
  client.create = jest.fn().mockResolvedValue({ data: {} })
  return client
}

describe('FederatedFolderModal', () => {
  let client
  let sharingContextValue

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDocumentPermissions.mockReturnValue([])
    mockFetchSharedDriveSharingLinks.mockResolvedValue([])
    mockGetSharingLink.mockReturnValue('https://example.com/share/abc123')
    mockGetFederatedShareLink.mockReturnValue(
      'https://example.com/share/federated-abc123'
    )
    mockGetRecipients.mockReturnValue([])
    mockGetSharingById.mockReturnValue(null)
    mockHasSharedChild.mockReturnValue(false)
    mockHasSharedParent.mockReturnValue(false)
    mockShareByLink.mockResolvedValue({
      data: {
        _id: 'permission-id',
        attributes: {
          shortcodes: { code: 'abc123' }
        }
      }
    })
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn()
      }
    })
    client = createTestClient()
    sharingContextValue = createSharingContextValue()
    usePendingRecipients.mockReturnValue({
      pendingRecipients: [],
      setPendingRecipients: jest.fn(),
      selectedOption: 'readWrite',
      setSelectedOption: jest.fn()
    })
    getOrCreateFromArray.mockResolvedValue([])
  })

  const setup = (props = {}) => {
    return render(
      <AppLike client={client} sharingContextValue={sharingContextValue}>
        <FederatedFolderModal
          document={mockDocument}
          onClose={mockOnClose}
          {...props}
        />
      </AppLike>
    )
  }

  describe('initialization', () => {
    it('should pass document name as title', async () => {
      const { findByText } = setup()

      await findByText('Share "My Test Folder"')
    })

    it('should pass default title when document has no name', async () => {
      const documentWithoutName = { _id: 'folder-456', path: '/test' }
      const { findByText } = setup({ document: documentWithoutName })

      await findByText('Share ""')
    })

    it('should show Copy link', async () => {
      const { findByText } = setup()

      await findByText('Copy link')
    })

    it('should show link access as soon as a link is generated', async () => {
      mockGetSharingLink.mockReturnValue(null)
      const { findByText, queryByText, rerender } = setup()

      expect(queryByText('Anyone with the link')).toBe(null)

      mockGetSharingLink.mockReturnValue('https://example.com/share/abc123')
      rerender(
        <AppLike client={client} sharingContextValue={sharingContextValue}>
          <FederatedFolderModal document={mockDocument} onClose={mockOnClose} />
        </AppLike>
      )

      await findByText('Anyone with the link')
    })

    it('should hide share by email when document is in federated shared folder received by current user', async () => {
      const { findByText, queryByText } = setup({
        document: { ...mockDocument, driveId: 'federated-folder-id' }
      })

      await findByText('Copy link')

      expect(queryByText('Add users')).toBe(null)
      expect(queryByText('Done')).toBe(null)
    })

    it('should show only by link message when document is in federated shared folder received by current user', async () => {
      const { findByText } = setup({
        document: {
          ...mockDocument,
          driveId: 'federated-folder-id',
          type: 'directory'
        }
      })

      await findByText('This folder can only be shared by link, because')
      await findByText('it has a shared parent')
    })

    it('should allow share by email when document is the federated shared folder root', async () => {
      mockGetSharingById.mockReturnValue({
        attributes: {
          rules: [
            { values: ['another-folder-id'] },
            { values: ['yet-another-folder-id', mockDocument._id] }
          ]
        }
      })

      const { findByText, queryByText } = setup({
        document: {
          ...mockDocument,
          driveId: 'federated-folder-id',
          type: 'directory'
        }
      })

      await findByText('Add users')

      expect(
        queryByText('This folder can only be shared by link, because')
      ).toBe(null)
      expect(queryByText('it has a shared parent')).toBe(null)
    })
  })

  describe('shared drive link fetch on mount', () => {
    it('should fetch shared drive sharing links when document has a driveId and no permissions yet', async () => {
      mockGetDocumentPermissions.mockReturnValue([])

      setup({
        document: { ...mockDocument, driveId: 'federated-folder-id' }
      })

      await waitFor(() => {
        expect(mockFetchSharedDriveSharingLinks).toHaveBeenCalledTimes(1)
      })
      expect(mockFetchSharedDriveSharingLinks).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: mockDocument._id,
          driveId: 'federated-folder-id'
        })
      )
    })

    it('should use document.id when _id is missing', async () => {
      const document = {
        id: 'folder-id-only',
        name: 'My Test Folder',
        path: '/test/folder',
        driveId: 'federated-folder-id'
      }

      setup({ document })

      await waitFor(() => {
        expect(mockFetchSharedDriveSharingLinks).toHaveBeenCalledWith(document)
      })
      expect(mockGetDocumentPermissions).toHaveBeenCalledWith('folder-id-only')
    })

    it('should not fetch shared drive sharing links when document has no driveId', async () => {
      const { findByText } = setup({ document: mockDocument })

      await findByText('Copy link')

      expect(mockFetchSharedDriveSharingLinks).not.toHaveBeenCalled()
    })

    it('should not refetch after one attempt when permissions stay empty', async () => {
      const document = { ...mockDocument, driveId: 'federated-folder-id' }
      const { rerender } = setup({ document })

      await waitFor(() => {
        expect(mockFetchSharedDriveSharingLinks).toHaveBeenCalledTimes(1)
      })

      rerender(
        <AppLike client={client} sharingContextValue={sharingContextValue}>
          <FederatedFolderModal document={document} onClose={mockOnClose} />
        </AppLike>
      )

      expect(mockFetchSharedDriveSharingLinks).toHaveBeenCalledTimes(1)
    })

    it('should not fetch shared drive sharing links when permissions are already loaded', async () => {
      mockGetDocumentPermissions.mockReturnValue([
        {
          id: 'perm-1',
          type: 'io.cozy.permissions',
          attributes: { shortcodes: { code: 'abc' } }
        }
      ])

      const { findByText } = setup({
        document: { ...mockDocument, driveId: 'federated-folder-id' }
      })

      await findByText('Copy link')

      expect(mockFetchSharedDriveSharingLinks).not.toHaveBeenCalled()
    })
  })

  describe('onSend callback', () => {
    const pendingRecipient = { name: 'Alice', email: 'alice@example.com' }

    it('should call onClose and skip share when there are no pending recipients', async () => {
      // pendingRecipients defaults to [] via beforeEach
      const { findByText } = setup()

      const sendButton = await findByText('Done')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
        expect(mockShare).not.toHaveBeenCalled()
      })
    })

    it('should call share with correct parameters', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [pendingRecipient],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
      mockShare.mockResolvedValueOnce({})
      const { findByText } = setup()

      const sendButton = await findByText('Done')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          description: 'My Test Folder',
          document: mockDocument,
          recipients: [pendingRecipient],
          readOnlyRecipients: [],
          sharedDrive: true,
          openSharing: false
        })
      })
    })

    it('should show success alert and close modal on successful share', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [pendingRecipient],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
      mockShare.mockResolvedValueOnce({})
      const { findByText } = setup()

      const sendButton = await findByText('Done')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith({
          message: 'Folder has been shared',
          severity: 'success',
          variant: 'filled'
        })
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should show error alert when share fails', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [pendingRecipient],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
      mockShare.mockRejectedValueOnce(new Error('Share failed'))
      const { findByText } = setup()

      const sendButton = await findByText('Done')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith({
          message: 'Error while sharing folder',
          severity: 'error',
          variant: 'filled'
        })
        expect(mockOnClose).not.toHaveBeenCalled()
      })
    })

    it('should show progress icon on Done button while share is in progress', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [pendingRecipient],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
      let resolveShare
      mockShare.mockReturnValueOnce(
        new Promise(resolve => {
          resolveShare = resolve
        })
      )
      const { findByText, getByRole, queryByRole } = setup()

      const sendButton = await findByText('Done')

      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(getByRole('button', { name: 'Done' })).toBeDisabled()
        expect(queryByRole('progressbar')).not.toBeNull()
      })

      await act(async () => {
        resolveShare({})
      })
    })
  })

  describe('onClose callback', () => {
    it('should call onClose when close button is clicked', async () => {
      const { findByRole } = setup()

      const closeButton = await findByRole('button', { name: /close/i })

      fireEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should ask confirmation when close button is clicked with pending recipients', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [{ name: 'Alice', email: 'alice@example.com' }],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })

      const { getByRole, findByRole, getByText } = setup()

      const closeButton = await findByRole('button', { name: /close/i })

      fireEvent.click(closeButton)

      expect(getByText("Discard the changes you haven't saved?")).toBeTruthy()
      expect(mockOnClose).not.toHaveBeenCalled()

      fireEvent.click(getByRole('button', { name: 'Cancel' }))

      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should close after discard confirmation', async () => {
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [{ name: 'Alice', email: 'alice@example.com' }],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn()
      })

      const { getByRole, findByRole, getByText } = setup()

      const closeButton = await findByRole('button', { name: /close/i })

      fireEvent.click(closeButton)

      expect(getByText("Discard the changes you haven't saved?")).toBeTruthy()

      fireEvent.click(getByRole('button', { name: 'Discard' }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })
})
