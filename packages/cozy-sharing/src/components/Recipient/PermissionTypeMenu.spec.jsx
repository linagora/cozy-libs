import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { PermissionTypeMenu } from './PermissionTypeMenu'
import AppLike from '../../../test/AppLike'

const mockUpdateSharingMemberType = jest.fn()
const mockHasSharedParent = jest.fn()
const mockGetSharedParentPath = jest.fn()
const mockShowAlert = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    hasSharedParent: mockHasSharedParent,
    getSharedParentPath: mockGetSharedParentPath,
    updateSharingMemberType: mockUpdateSharingMemberType
  })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  __esModule: true,
  default: ({ children }) => children,
  useAlert: () => ({
    showAlert: mockShowAlert
  })
}))

describe('PermissionTypeMenu component', () => {
  const client = createMockClient({})
  client.options = {
    uri: 'http://cozy.local:8080'
  }

  const defaultProps = {
    sharingId: 'sharing-123',
    memberIndex: 1,
    type: 'two-way',
    recipient: { name: 'Alice' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = props => {
    return render(
      <AppLike client={client}>
        <PermissionTypeMenu {...defaultProps} {...props} />
      </AppLike>
    )
  }

  let createRangeBackup

  beforeAll(() => {
    createRangeBackup = global.document.createRange
    global.document.createRange = jest.fn(() => ({
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document
      }
    }))
  })

  afterAll(() => {
    global.document.createRange = createRangeBackup
  })

  it('should render the current permission type', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Editor' })).toBeInTheDocument()
  })

  it('should call updateSharingMemberType when changing to one-way', async () => {
    mockUpdateSharingMemberType.mockResolvedValue(undefined)

    const { getByRole } = setup({ type: 'two-way' })

    fireEvent.click(getByRole('button', { name: 'Editor' }))
    fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))

    expect(mockUpdateSharingMemberType).toHaveBeenCalledWith(
      'sharing-123',
      1,
      'one-way'
    )
  })

  it('should call updateSharingMemberType when changing to two-way', async () => {
    mockUpdateSharingMemberType.mockResolvedValue(undefined)

    const { getByRole } = setup({ type: 'one-way' })

    fireEvent.click(getByRole('button', { name: 'Viewer' }))
    fireEvent.click(getByRole('menuitem', { name: 'Editor' }))

    expect(mockUpdateSharingMemberType).toHaveBeenCalledWith(
      'sharing-123',
      1,
      'two-way'
    )
  })

  it('should show error alert when updateSharingMemberType fails', async () => {
    mockUpdateSharingMemberType.mockRejectedValue(new Error('Network error'))

    const { getByRole } = setup({ type: 'two-way' })

    fireEvent.click(getByRole('button', { name: 'Editor' }))
    fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith({
        message:
          'An error occurred while changing the permissions. Please try again.',
        severity: 'error',
        variant: 'filled'
      })
    })
  })

  it('should not call updateSharingMemberType when selecting same type', async () => {
    mockUpdateSharingMemberType.mockResolvedValue(undefined)

    const { getByRole } = setup({ type: 'two-way' })

    fireEvent.click(getByRole('button', { name: 'Editor' }))
    fireEvent.click(getByRole('menuitem', { name: 'Editor' }))

    expect(mockUpdateSharingMemberType).not.toHaveBeenCalled()
  })

  describe('when downgrading to viewer on a folder with a shared parent', () => {
    const folderDocument = {
      _id: 'doc-1',
      type: 'directory',
      path: '/parent/child'
    }

    beforeEach(() => {
      mockHasSharedParent.mockReturnValue(true)
    })

    it('should ask for confirmation instead of updating directly', () => {
      const { getByRole } = setup({
        type: 'two-way',
        document: folderDocument
      })

      fireEvent.click(getByRole('button', { name: 'Editor' }))
      fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))

      expect(mockUpdateSharingMemberType).not.toHaveBeenCalled()
      expect(getByRole('button', { name: 'Update parent' })).toBeInTheDocument()
    })

    it('should call updateSharingMemberType when confirming', async () => {
      mockUpdateSharingMemberType.mockResolvedValue(undefined)

      const { getByRole } = setup({
        type: 'two-way',
        document: folderDocument
      })

      fireEvent.click(getByRole('button', { name: 'Editor' }))
      fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))
      fireEvent.click(getByRole('button', { name: 'Update parent' }))

      await waitFor(() => {
        expect(mockUpdateSharingMemberType).toHaveBeenCalledWith(
          'sharing-123',
          1,
          'one-way'
        )
      })
    })

    it('should also downgrade the member on read-write ancestor shares when confirming', async () => {
      mockUpdateSharingMemberType.mockResolvedValue(undefined)

      const { getByRole } = setup({
        type: 'two-way',
        document: folderDocument,
        recipient: {
          name: 'Bob',
          sources: [
            { kind: 'self', sharing_id: 'sharing-123', member_index: 1 },
            {
              kind: 'ancestor',
              sharing_id: 'sharing-parent',
              member_index: 2,
              read_only: false
            },
            {
              kind: 'ancestor',
              sharing_id: 'sharing-grandparent',
              member_index: 3,
              read_only: true
            }
          ]
        }
      })

      fireEvent.click(getByRole('button', { name: 'Editor' }))
      fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))
      fireEvent.click(getByRole('button', { name: 'Update parent' }))

      await waitFor(() => {
        expect(mockUpdateSharingMemberType.mock.calls).toEqual([
          ['sharing-parent', 2, 'one-way'],
          ['sharing-123', 1, 'one-way']
        ])
      })
    })

    it('should not call updateSharingMemberType when cancelling', () => {
      const { getByRole, queryByRole } = setup({
        type: 'two-way',
        document: folderDocument
      })

      fireEvent.click(getByRole('button', { name: 'Editor' }))
      fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))
      fireEvent.click(getByRole('button', { name: 'Cancel' }))

      expect(mockUpdateSharingMemberType).not.toHaveBeenCalled()
      expect(queryByRole('button', { name: 'Update parent' })).toBe(null)
    })

    it('should update directly when the folder has no shared parent', () => {
      mockHasSharedParent.mockReturnValue(false)

      const { getByRole, queryByRole } = setup({
        type: 'two-way',
        document: folderDocument
      })

      fireEvent.click(getByRole('button', { name: 'Editor' }))
      fireEvent.click(getByRole('menuitem', { name: 'Viewer' }))

      expect(mockUpdateSharingMemberType).toHaveBeenCalledWith(
        'sharing-123',
        1,
        'one-way'
      )
      expect(queryByRole('button', { name: 'Update parent' })).toBe(null)
    })
  })
})
