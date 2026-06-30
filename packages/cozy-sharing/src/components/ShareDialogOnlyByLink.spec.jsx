import { render, screen } from '@testing-library/react'
import React from 'react'

import ShareDialogOnlyByLink from './ShareDialogOnlyByLink'
import AppLike from '../../test/AppLike'

let mockSharingLink = null

jest.mock('./ShareByLink', () => () => <button>Copy link</button>)

jest.mock('../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    documentType: 'Files',
    getDocumentPermissions: () => [],
    getSharingLink: () => mockSharingLink,
    revokeSharingLink: jest.fn(),
    updateDocumentPermissions: jest.fn(),
    isOrgSharedDrive: jest.fn(() => false)
  })
}))

describe('ShareDialogOnlyByLink', () => {
  beforeEach(() => {
    mockSharingLink = null
  })

  const renderModal = () => (
    <AppLike>
      <ShareDialogOnlyByLink
        document={{ _id: 'file-id', attributes: { name: 'file.txt' } }}
        documentType="Files"
        isOwner
        onClose={jest.fn()}
        onRevoke={jest.fn()}
        onRevokeSelf={jest.fn()}
        permissions={[]}
        recipients={[]}
      />
    </AppLike>
  )

  const setup = () => render(renderModal())

  it('shows link access as soon as a link is generated', () => {
    const { rerender } = setup()

    expect(screen.queryByText('Anyone with the link')).toBe(null)

    mockSharingLink = 'https://example.com/public'
    rerender(renderModal())

    expect(screen.queryByText('Anyone with the link')).toBeInTheDocument()
  })

  it('hides link access as soon as a link is revoked', () => {
    mockSharingLink = 'https://example.com/public'
    const { rerender } = setup()

    expect(screen.queryByText('Anyone with the link')).toBeInTheDocument()

    mockSharingLink = null
    rerender(renderModal())

    expect(screen.queryByText('Anyone with the link')).toBe(null)
  })
})
