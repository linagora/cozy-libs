import { render } from '@testing-library/react'
import React from 'react'

import MemberRecipientStatus from './MemberRecipientStatus'
import AppLike from '../../../test/AppLike'

describe('MemberRecipientStatus component', () => {
  const setup = props =>
    render(
      <AppLike>
        <MemberRecipientStatus {...props} />
      </AppLike>
    )

  it('should show email when status is ready and recipient has a name', () => {
    const { getByText } = setup({
      status: 'ready',
      isMe: false,
      email: 'other@example.com',
      instance: 'foo.mycozy.cloud',
      name: 'Other Person'
    })
    expect(getByText('other@example.com')).toBeTruthy()
  })

  it('should render nothing when recipient has no name and status is ready', () => {
    const { queryByText } = setup({
      status: 'ready',
      isMe: false,
      email: 'other@example.com',
      instance: 'foo.mycozy.cloud'
    })
    expect(queryByText('other@example.com')).toBe(null)
    expect(queryByText('foo.mycozy.cloud')).toBe(null)
  })

  it('should show email when isMe is true regardless of status', () => {
    const { getByText } = setup({
      status: 'pending',
      isMe: true,
      email: 'me@example.com'
    })
    expect(getByText('me@example.com')).toBeTruthy()
  })

  it('should fallback to instance when email is missing and status is ready', () => {
    const { getByText } = setup({
      status: 'ready',
      isMe: false,
      instance: 'foo.mycozy.cloud'
    })
    expect(getByText('foo.mycozy.cloud')).toBeTruthy()
  })

  it('should show email when status is owner, not isMe, and recipient has a name', () => {
    const { getByText } = setup({
      status: 'owner',
      isMe: false,
      email: 'owner@example.com',
      instance: 'foo.mycozy.cloud',
      name: 'Owner Person'
    })
    expect(getByText('owner@example.com')).toBeTruthy()
  })

  it('should show "Sending invitation mail..." when status is mail-not-sent and not isMe', () => {
    const { getByText } = setup({
      status: 'mail-not-sent',
      isMe: false
    })
    expect(getByText('Sending invitation mail...')).toBeTruthy()
  })

  it('should show "Invitation sent" when status is pending', () => {
    const { getByText } = setup({
      status: 'pending',
      isMe: false
    })
    expect(getByText('Invitation sent')).toBeTruthy()
  })

  it('should show "Invitation seen" when status is seen', () => {
    const { getByText } = setup({
      status: 'seen',
      isMe: false
    })
    expect(getByText('Invitation seen')).toBeTruthy()
  })

  it('should fallback to "Invitation sent" for unknown status', () => {
    const { getByText } = setup({
      status: 'unknown-status',
      isMe: false
    })
    expect(getByText('Invitation sent')).toBeTruthy()
  })
})
