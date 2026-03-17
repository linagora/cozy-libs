import { render, fireEvent } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import MemberRecipient from './MemberRecipient'
import AppLike from '../../../test/AppLike'

const mockUpdateDocumentPermissions = jest.fn()
const mockUpdateSharingMemberType = jest.fn()

jest.mock('../../hooks/useSharingContext', () => ({
  useSharingContext: () => ({
    updateDocumentPermissions: mockUpdateDocumentPermissions,
    updateSharingMemberType: mockUpdateSharingMemberType
  })
}))

describe('MemberRecipient component', () => {
  const client = createMockClient({})
  client.options = {
    uri: 'foo.mycozy.cloud'
  }

  const setup = props => {
    return render(
      <AppLike client={client}>
        <MemberRecipient {...props} />
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

  it('should render if isMe ', () => {
    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way'
    })
    expect(getByText('You')).toBeTruthy()
    expect(getByText('foo.mycozy.cloud')).toBeTruthy()
  })

  it('should match snapshot if isOwner', () => {
    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      isOwner: true
    })
    expect(getByText('You')).toBeTruthy()
    expect(getByText('foo.mycozy.cloud')).toBeTruthy()
  })

  it('should call revokeSelf if I am not the owner but try to revoke myself', async () => {
    const onRevoke = jest.fn()
    const onRevokeSelf = jest.fn()

    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      documentType: 'Files',
      onRevoke,
      onRevokeSelf
    })

    fireEvent.click(getByText('can change'))
    fireEvent.click(getByText('Remove me from sharing'))
    expect(onRevoke).not.toHaveBeenCalled()
    expect(onRevokeSelf).toHaveBeenCalled()
  })

  it('should call revoke if I am the owner of the sharing', async () => {
    const onRevoke = jest.fn()
    const onRevokeSelf = jest.fn()

    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      isOwner: true,
      documentType: 'Files',
      onRevoke,
      onRevokeSelf
    })

    fireEvent.click(getByText('can change'))
    fireEvent.click(getByText('Remove from sharing'))
    expect(onRevoke).toHaveBeenCalled()
    expect(onRevokeSelf).not.toHaveBeenCalled()
  })

  it('should render confirmation actions if recipient is waiting for confirmation', () => {
    const confirmRecipient = jest.fn()
    const rejectRecipient = jest.fn()

    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      isOwner: false,
      documentType: 'Organizations',
      recipientConfirmationData: {
        email: 'me@bob.cozy.localhost'
      },
      rejectRecipient,
      confirmRecipient
    })

    expect(getByText('Verify')).toBeTruthy()
  })

  it('should not render confirmation actions if no recipient is waiting for confirmation', () => {
    const confirmRecipient = jest.fn()
    const rejectRecipient = jest.fn()

    const { queryByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      isOwner: false,
      documentType: 'Organizations',
      recipientConfirmationData: undefined,
      rejectRecipient,
      confirmRecipient
    })

    expect(queryByText('Verify')).not.toBeInTheDocument()
  })

  it(`should call verifyRecipient when clicking 'verify' button`, () => {
    const verifyRecipient = jest.fn()

    const { getByText } = setup({
      instance: 'foo.mycozy.cloud',
      status: 'ready',
      type: 'two-way',
      isOwner: false,
      documentType: 'Organizations',
      recipientConfirmationData: {
        email: 'me@bob.cozy.localhost'
      },
      verifyRecipient
    })

    fireEvent.click(getByText('Verify'))

    expect(verifyRecipient).toHaveBeenCalledWith({
      email: 'me@bob.cozy.localhost'
    })
  })
})
