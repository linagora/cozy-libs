import { fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { FederatedFolderModal } from './FederatedFolderModal'
import { getOrCreateFromArray } from '../../helpers/contacts'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import AppLike from '../SharingBanner/test/AppLike'

const mockShare = jest.fn()
const mockRevoke = jest.fn()
const mockGetSharingLink = jest.fn()
const mockGetRecipients = jest.fn().mockReturnValue([])
const mockShowAlert = jest.fn()
const mockOnClose = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    share: mockShare,
    revoke: mockRevoke,
    getSharingLink: mockGetSharingLink,
    getDocumentPermissions: jest.fn().mockReturnValue([]),
    getRecipients: mockGetRecipients
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
  getDocumentPermissions: jest.fn().mockReturnValue([]),
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
    mockGetSharingLink.mockReturnValue('https://example.com/share/abc123')
    mockGetRecipients.mockReturnValue([])
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
