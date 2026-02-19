import { fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { FederatedFolderModal } from './FederatedFolderModal'
import AppLike from '../SharingBanner/test/AppLike'

const mockShare = jest.fn()
const mockGetSharingLink = jest.fn()
const mockShowAlert = jest.fn()
const mockOnClose = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    share: mockShare,
    getSharingLink: mockGetSharingLink,
    getDocumentPermissions: jest.fn().mockReturnValue([])
  })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({
    showAlert: mockShowAlert
  })
}))

jest.mock('../../hoc/withLocales', () => Component => Component)

jest.mock('./DumbFederatedFolderModal', () => ({
  DumbFederatedFolderModal: ({
    title,
    createContact,
    recipients,
    readOnlyRecipients,
    onRevoke,
    onSetType,
    onSend,
    onClose,
    onShare,
    sharingLink
  }) => (
    <div data-testid="dumb-modal">
      <span data-testid="title">{title}</span>
      <span data-testid="sharing-link">{sharingLink}</span>
      <span data-testid="recipients-count">{recipients.length}</span>
      <span data-testid="readOnly-recipients-count">
        {readOnlyRecipients ? readOnlyRecipients.length : 0}
      </span>
      <button
        data-testid="btn-share"
        onClick={() =>
          onShare({
            recipients: [{ _id: 'r1', displayName: 'Alice' }],
            readOnlyRecipients: [{ _id: 'r2', displayName: 'Bob' }]
          })
        }
      >
        Share
      </button>
      <button data-testid="btn-send" onClick={onSend}>
        Send
      </button>
      <button
        data-testid="btn-set-type-two-way"
        onClick={() => onSetType('virtual-shared-drive-sharing-r2', 'two-way')}
      >
        Set Two-Way
      </button>
      <button
        data-testid="btn-set-type-one-way"
        onClick={() => onSetType('virtual-shared-drive-sharing-r1', 'one-way')}
      >
        Set One-Way
      </button>
      <button
        data-testid="btn-revoke"
        onClick={() => onRevoke('virtual-shared-drive-sharing-r1')}
      >
        Revoke
      </button>
      <button data-testid="btn-close" onClick={onClose}>
        Close
      </button>
      <button
        data-testid="btn-create-contact"
        onClick={() => createContact({ email: 'test@example.com' })}
      >
        Create Contact
      </button>
    </div>
  )
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
    client = createTestClient()
    sharingContextValue = createSharingContextValue()
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
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('title').textContent).toBe('Share "My Test Folder"')
      })
    })

    it('should pass default title when document has no name', async () => {
      const documentWithoutName = { _id: 'folder-456', path: '/test' }
      const { getByTestId } = setup({ document: documentWithoutName })

      await waitFor(() => {
        expect(getByTestId('title').textContent).toBe('Share ""')
      })
    })

    it('should pass sharing link to DumbFederatedFolderModal', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('sharing-link').textContent).toBe(
          'https://example.com/share/abc123'
        )
      })
    })

    it('should pass null sharing link when document is undefined', async () => {
      const { getByTestId } = setup({ document: undefined })

      await waitFor(() => {
        expect(getByTestId('sharing-link').textContent).toBe('')
      })
    })
  })

  describe('onShare callback', () => {
    it('should update recipients when onShare is called', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('0')
      })

      fireEvent.click(getByTestId('btn-share'))

      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
      })
    })
  })

  describe('onSend callback', () => {
    it('should call share with correct parameters', async () => {
      mockShare.mockResolvedValueOnce({})
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-send')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-share'))
      fireEvent.click(getByTestId('btn-send'))

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          description: 'My Test Folder',
          document: mockDocument,
          recipients: [{ _id: 'r1', displayName: 'Alice' }],
          readOnlyRecipients: [{ _id: 'r2', displayName: 'Bob' }],
          sharedDrive: true,
          openSharing: false
        })
      })
    })

    it('should show success alert and close modal on successful share', async () => {
      mockShare.mockResolvedValueOnce({})
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-send')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-send'))

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
      mockShare.mockRejectedValueOnce(new Error('Share failed'))
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-send')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-send'))

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

  describe('onSetType callback', () => {
    it('should move recipient from readOnlyRecipients to recipients when setting two-way', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-share')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-share'))

      // After btn-share: combined recipients = 2 (1 readWrite + 1 readOnly)
      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
        expect(getByTestId('readOnly-recipients-count').textContent).toBe('1')
      })

      fireEvent.click(getByTestId('btn-set-type-two-way'))

      // After setting two-way: Bob moves from readOnlyRecipients to recipients
      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
        expect(getByTestId('readOnly-recipients-count').textContent).toBe('0')
      })
    })

    it('should move recipient from recipients to readOnlyRecipients when setting one-way', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-share')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-share'))

      // After btn-share: combined recipients = 2 (1 readWrite + 1 readOnly)
      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
        expect(getByTestId('readOnly-recipients-count').textContent).toBe('1')
      })

      fireEvent.click(getByTestId('btn-set-type-one-way'))

      // After setting one-way: Alice moves from recipients to readOnlyRecipients
      // Combined count stays at 2, but readOnlyRecipients increases from 1 to 2
      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
        expect(getByTestId('readOnly-recipients-count').textContent).toBe('2')
      })
    })
  })

  describe('onRevoke callback', () => {
    it('should remove recipient from both lists', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-share')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-share'))

      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
      })

      fireEvent.click(getByTestId('btn-revoke'))

      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('1')
      })
    })
  })

  describe('onClose callback', () => {
    it('should call onClose when close button is clicked', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-close')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-close'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('createContact callback', () => {
    it('should call client.create when creating a contact', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-create-contact')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-create-contact'))

      await waitFor(() => {
        expect(client.create).toHaveBeenCalledWith('io.cozy.contacts', {
          email: 'test@example.com'
        })
      })
    })
  })
})
