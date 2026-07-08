import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { PermissionTypeMenu } from './PermissionTypeMenu'
import AppLike from '../../../test/AppLike'

const mockUpdateSharingMemberType = jest.fn()
const mockShowAlert = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
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
    type: 'two-way'
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
})
