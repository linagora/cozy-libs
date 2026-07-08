import { render } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import MemberRecipientPermissions from './MemberRecipientPermissions'
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

describe('MemberRecipientPermissions component', () => {
  const client = createMockClient({})
  client.options = {
    uri: 'http://cozy.local:8080'
  }

  const defaultProps = {
    isOwner: true,
    isSharedDrive: false,
    status: 'ready',
    instance: 'http://cozy.local:8080',
    type: 'two-way',
    document: { id: 'doc-123', type: 'io.cozy.files', path: '/test' },
    sharingId: 'sharing-123',
    memberIndex: 1,
    onRevoke: jest.fn(),
    onRevokeSelf: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = props => {
    return render(
      <AppLike client={client}>
        <MemberRecipientPermissions {...defaultProps} {...props} />
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

  it('should not render menu when user is not owner and not the shared drive contact', () => {
    const { queryByRole } = setup({
      isOwner: false,
      instance: 'http://other-cozy.local:8080'
    })

    expect(queryByRole('button', { name: 'Editor' })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: 'Viewer' })).not.toBeInTheDocument()
  })

  it('should render menu for owner', () => {
    const { getByRole } = setup({ isOwner: true })

    expect(getByRole('button', { name: 'Editor' })).toBeInTheDocument()
  })

  it('should render menu for the user themselves', () => {
    const { getByRole } = setup({
      isOwner: false,
      instance: 'http://cozy.local:8080'
    })

    expect(getByRole('button', { name: 'Editor' })).toBeInTheDocument()
  })
})
