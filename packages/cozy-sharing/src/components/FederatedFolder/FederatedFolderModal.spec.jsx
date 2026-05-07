import { fireEvent, render, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { FederatedFolderModal } from './FederatedFolderModal'
import AppLike from '../SharingBanner/test/AppLike'
import { usePendingRecipients } from '../../hooks/usePendingRecipients'
import { getOrCreateFromArray } from '../../helpers/contacts'

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

jest.mock('./DumbFederatedFolderModal', () => ({
  DumbFederatedFolderModal: ({
    title,
    recipients,
    onRevoke,
    onSend,
    onClose,
    sharingLink,
    pendingRecipients,
    selectedOption
  }) => (
    <div data-testid="dumb-modal">
      <span data-testid="title">{title}</span>
      <span data-testid="sharing-link">{sharingLink}</span>
      <span data-testid="recipients-count">{recipients.length}</span>
      <span data-testid="pending-recipients-count">{pendingRecipients.length}</span>
      <span data-testid="selected-option">{selectedOption}</span>
      <button data-testid="btn-send" onClick={onSend}>
        Send
      </button>
      <button
        data-testid="btn-revoke"
        onClick={() => onRevoke({ _id: 'folder-123' }, 'abc', 1)}
      >
        Revoke
      </button>
      <button data-testid="btn-close" onClick={onClose}>
        Close
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
    mockGetRecipients.mockReturnValue([])
    client = createTestClient()
    sharingContextValue = createSharingContextValue()
    usePendingRecipients.mockReturnValue({
      pendingRecipients: [],
      setPendingRecipients: jest.fn(),
      selectedOption: 'readWrite',
      setSelectedOption: jest.fn(),
      reset: jest.fn()
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

    it('should pass selectedOption from usePendingRecipients', async () => {
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('selected-option').textContent).toBe('readWrite')
      })
    })
  })

  describe('onSend callback', () => {
    const pendingRecipient = { name: 'Alice', email: 'alice@example.com' }

    it('should call onClose and skip share when there are no pending recipients', async () => {
      // pendingRecipients defaults to [] via beforeEach
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-send')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-send'))

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
        setSelectedOption: jest.fn(),
        reset: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
      mockShare.mockResolvedValueOnce({})
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('btn-send')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-send'))

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
        setSelectedOption: jest.fn(),
        reset: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
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
      usePendingRecipients.mockReturnValue({
        pendingRecipients: [pendingRecipient],
        setPendingRecipients: jest.fn(),
        selectedOption: 'readWrite',
        setSelectedOption: jest.fn(),
        reset: jest.fn()
      })
      getOrCreateFromArray.mockResolvedValue([pendingRecipient])
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

  describe('onRevoke callback', () => {
    it('should call revoke from sharing context for existing members', async () => {
      mockRevoke.mockResolvedValueOnce({})
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('dumb-modal')).toBeTruthy()
      })

      fireEvent.click(getByTestId('btn-revoke'))

      await waitFor(() => {
        expect(mockRevoke).toHaveBeenCalledWith({ _id: 'folder-123' }, 'abc', 1)
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

  describe('existing recipients', () => {
    const existingRecipients = [
      {
        index: 'sharing-abc-member-0',
        name: 'Charlie',
        email: 'charlie@example.com',
        status: 'owner',
        type: 'two-way',
        sharingId: 'abc',
        memberIndex: 0
      },
      {
        index: 'sharing-abc-member-1',
        name: 'Diana',
        email: 'diana@example.com',
        status: 'ready',
        type: 'one-way',
        sharingId: 'abc',
        memberIndex: 1
      }
    ]

    it('should display existing recipients from getRecipients', async () => {
      mockGetRecipients.mockReturnValue(existingRecipients)
      const { getByTestId } = setup()

      await waitFor(() => {
        expect(getByTestId('recipients-count').textContent).toBe('2')
      })
    })
  })
})
