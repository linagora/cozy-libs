import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import PublicAccess from './PublicAccess'
import AppLike from '../../../test/AppLike'
import { READ_ONLY_PERMS, WRITE_PERMS } from '../ShareRestrictionModal/helpers'

const mockShareByLink = jest.fn()
const mockHasWriteAccess = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    shareByLink: mockShareByLink,
    getOwner: jest.fn(),
    getSharingById: jest.fn(),
    hasWriteAccess: mockHasWriteAccess
  })
}))

const makeLinkPermissions = verbs => [
  { attributes: { permissions: { files: { verbs } } } }
]

describe('PublicAccess', () => {
  const client = createMockClient({})
  const document = { _id: 'file-1', name: 'file.txt' }
  const onUpdateLinkPermissions = jest.fn()
  const onRevokeLink = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockShareByLink.mockResolvedValue({ data: {} })
    mockHasWriteAccess.mockReturnValue(true)
  })

  const setup = ({
    link = null,
    permissions = [],
    sharedDocument = document
  } = {}) =>
    render(
      <AppLike client={client}>
        <PublicAccess
          document={sharedDocument}
          documentType="Files"
          link={link}
          permissions={permissions}
          onUpdateLinkPermissions={onUpdateLinkPermissions}
          onRevokeLink={onRevokeLink}
        />
      </AppLike>
    )

  it('creates a write link when Editor is picked from Restricted', async () => {
    setup()
    fireEvent.click(screen.getByText('Restricted'))
    fireEvent.click(screen.getByText('Editor'))
    await waitFor(() =>
      expect(mockShareByLink).toHaveBeenCalledWith(
        document,
        expect.objectContaining({ verbs: WRITE_PERMS })
      )
    )
  })

  it('updates the link verbs when Viewer is picked on an editor link', () => {
    setup({ link: 'url', permissions: makeLinkPermissions(WRITE_PERMS) })
    fireEvent.click(screen.getAllByText('Editor')[0])
    fireEvent.click(screen.getByText('Viewer'))
    expect(onUpdateLinkPermissions).toHaveBeenCalledWith(document, {
      verbs: READ_ONLY_PERMS
    })
  })
})
