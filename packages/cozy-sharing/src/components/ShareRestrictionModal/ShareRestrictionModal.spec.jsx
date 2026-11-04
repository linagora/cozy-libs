import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { ShareRestrictionModal } from './ShareRestrictionModal'
import { READ_ONLY_PERMS, WRITE_PERMS } from './helpers'
import AppLike from '../../../test/AppLike'

const mockUpdateDocumentPermissions = jest.fn()
const mockShareByLink = jest.fn()
let mockLink = null
let mockPermissions = []

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    documentType: 'Files',
    getDocumentPermissions: () => mockPermissions,
    getSharingLink: () => mockLink,
    updateDocumentPermissions: mockUpdateDocumentPermissions,
    shareByLink: mockShareByLink,
    revokeSharingLink: jest.fn()
  })
}))

const linkPermission = verbs => ({
  attributes: {
    permissions: { files: { verbs } },
    shortcodes: { code: 'code' }
  }
})

describe('ShareRestrictionModal', () => {
  const client = createMockClient({})
  client.capabilities = { flat_subdomains: true }
  const file = { _id: 'file-1', name: 'file.txt' }

  beforeEach(() => {
    jest.clearAllMocks()
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(), write: jest.fn() }
    })
  })

  const setup = () =>
    render(
      <AppLike client={client}>
        <ShareRestrictionModal file={file} onClose={jest.fn()} />
      </AppLike>
    )

  it('keeps editor rights when the settings of an editor link change', async () => {
    mockLink = 'url'
    mockPermissions = [linkPermission(WRITE_PERMS)]
    mockUpdateDocumentPermissions.mockResolvedValue([
      { data: linkPermission(WRITE_PERMS) }
    ])
    setup()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockUpdateDocumentPermissions).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ verbs: WRITE_PERMS })
      )
    )
  })

  it('creates a viewer link when the settings are confirmed without link', async () => {
    mockLink = null
    mockPermissions = []
    mockShareByLink.mockResolvedValue({ data: linkPermission(READ_ONLY_PERMS) })
    setup()
    fireEvent.click(screen.getByText('Confirm'))
    await waitFor(() =>
      expect(mockShareByLink).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ verbs: READ_ONLY_PERMS })
      )
    )
  })
})
