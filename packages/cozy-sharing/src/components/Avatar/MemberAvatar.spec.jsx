import { render, fireEvent } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import { MemberAvatar } from './MemberAvatar'
import AppLike from '../../../test/AppLike'

describe('MemberAvatar', () => {
  const client = createMockClient({})
  client.options = { uri: 'http://cozy.example.com' }

  const setup = recipient =>
    render(
      <AppLike client={client}>
        <MemberAvatar recipient={recipient} />
      </AppLike>
    )

  it('renders nothing when the recipient is missing', () => {
    const { container } = setup(undefined)

    // The component returns null; only the provider wrappers remain, with no
    // avatar rendered inside.
    expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders the avatar image when the recipient has an avatarPath and a status', () => {
    const { container } = setup({
      public_name: 'Bob',
      status: 'owner',
      avatarPath: '/sharings/123/recipients/0/avatar'
    })

    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img.getAttribute('src')).toBe(
      'http://cozy.example.com/sharings/123/recipients/0/avatar?v=owner'
    )
  })

  it('appends the cache-busting param with & when avatarPath already has a query string', () => {
    const { container } = setup({
      public_name: 'Bob',
      status: 'owner',
      avatarPath: '/public/avatar?fallback=initials'
    })

    expect(container.querySelector('img').getAttribute('src')).toBe(
      'http://cozy.example.com/public/avatar?fallback=initials&v=owner'
    )
  })

  it('renders the initials when there is no avatarPath', () => {
    const { container, getByText } = setup({
      public_name: 'Bob',
      status: 'owner'
    })

    expect(container.querySelector('img')).toBeNull()
    expect(getByText('B')).toBeTruthy()
  })

  it('falls back to the initials when the avatar image fails to load', () => {
    const { container, getByText } = setup({
      public_name: 'Bob',
      status: 'owner',
      avatarPath: '/sharings/123/recipients/0/avatar'
    })

    const img = container.querySelector('img')
    expect(img).toBeTruthy()

    fireEvent.error(img)

    expect(container.querySelector('img')).toBeNull()
    expect(getByText('B')).toBeTruthy()
  })
})
