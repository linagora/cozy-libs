import { render, fireEvent } from '@testing-library/react'
import React from 'react'

import { MemberAvatar } from './MemberAvatar'
import AppLike from '../../../test/AppLike'

describe('MemberAvatar', () => {
  const setup = (recipient, avatarUrl = null) =>
    render(
      <AppLike>
        <MemberAvatar recipient={recipient} avatarUrl={avatarUrl} />
      </AppLike>
    )

  it('renders nothing when the recipient is missing', () => {
    const { container } = setup(undefined)

    // The component returns null; only the provider wrappers remain, with no
    // avatar rendered inside.
    expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders the avatar image', () => {
    const { container } = setup(
      { public_name: 'Bob', status: 'owner' },
      'http://cozy.example.com/sharings/123/recipients/0/avatar?v=owner'
    )

    expect(container.querySelector('img').getAttribute('src')).toBe(
      'http://cozy.example.com/sharings/123/recipients/0/avatar?v=owner'
    )
  })

  it('renders the initials when there is no avatar URL', () => {
    const { container, getByText } = setup({
      _type: 'io.cozy.contacts',
      name: { givenName: 'Jon', familyName: 'Snow' }
    })

    expect(container.querySelector('img')).toBeNull()
    expect(getByText('JS')).toBeTruthy()
  })

  it('falls back to the initials when the avatar image fails to load', () => {
    const { container, getByText } = setup(
      { public_name: 'Bob', status: 'owner' },
      'http://cozy.example.com/sharings/123/recipients/0/avatar?v=owner'
    )

    fireEvent.error(container.querySelector('img'))

    expect(container.querySelector('img')).toBeNull()
    expect(getByText('B')).toBeTruthy()
  })
})
