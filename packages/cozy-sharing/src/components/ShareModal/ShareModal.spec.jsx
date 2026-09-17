import { render } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router'

import { ShareModal } from './ShareModal'

const mockIsOwner = jest.fn()
const mockHasWriteAccess = jest.fn()

jest.mock('cozy-flags')

jest.mock('../../hoc/withLocales', () => Component => Component)

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    byDocId: { 'doc-1': { sharings: ['sharing-1'] } },
    isOwner: mockIsOwner,
    hasWriteAccess: mockHasWriteAccess,
    documentType: 'Files',
    getRecipients: jest.fn().mockReturnValue([]),
    revokeSelf: jest.fn(),
    allLoaded: false
  })
}))

jest.mock('./EditableSharingModal', () => () => <div>editable-modal</div>)
jest.mock('./SharingDetailsModal', () => () => <div>details-modal</div>)
jest.mock('../FederatedFolder/FederatedFolderModal', () => () => (
  <div>federated-modal</div>
))

const mockDocument = { id: 'doc-1', driveId: undefined }

describe('ShareModal dispatcher', () => {
  beforeEach(() => {
    mockIsOwner.mockReset()
    mockHasWriteAccess.mockReset()
  })

  it('renders the editable modal when the current user has write access, even without reshare rights', () => {
    mockIsOwner.mockReturnValue(false)
    mockHasWriteAccess.mockReturnValue(true)

    const { getByText } = render(
      <MemoryRouter>
        <ShareModal document={mockDocument} />
      </MemoryRouter>
    )

    expect(getByText('editable-modal')).toBeTruthy()
    expect(mockHasWriteAccess).toHaveBeenCalledWith('doc-1', undefined)
  })

  it('renders the restricted details modal when the current user has read-only access', () => {
    mockIsOwner.mockReturnValue(false)
    mockHasWriteAccess.mockReturnValue(false)

    const { getByText } = render(
      <MemoryRouter>
        <ShareModal document={mockDocument} />
      </MemoryRouter>
    )

    expect(getByText('details-modal')).toBeTruthy()
  })
})
