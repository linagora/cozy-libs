import { render } from '@testing-library/react'
import AccountsListItem from 'components/AccountsList/AccountsListItem'
import React from 'react'

import AppLike from '../../../test/AppLike'

const mockClient = {
  plugins: {
    realtime: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    }
  },
  stackClient: {
    uri: 'https://cozy.tools:8080'
  },
  collection: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: {} })
  })),
  on: jest.fn()
}

describe('AccountsListItem', () => {
  it('should not render the caption since accountLogin is undefined', () => {
    const { container } = render(
      <AppLike client={mockClient}>
        <AccountsListItem
          account={{
            _id: 'account-1'
          }}
          konnector={{
            name: 'test-konnector',
            vendor_link: 'test konnector link'
          }}
          onClick={jest.fn()}
          trigger={{}}
        />
      </AppLike>
    )
    expect(container.textContent).toContain('account-1')
    expect(container.querySelector('.MuiTypography-caption')).toBeNull()
  })

  it('should render the caption since accountName !== login', () => {
    const { container } = render(
      <AppLike client={mockClient}>
        <AccountsListItem
          account={{
            _id: 'account-1',
            auth: { login: 'mylogin', accountName: 'myAccountName' }
          }}
          konnector={{
            name: 'test-konnector',
            vendor_link: 'test konnector link'
          }}
          onClick={jest.fn()}
          trigger={{}}
        />
      </AppLike>
    )
    expect(container.textContent).toContain('myAccountName')
    expect(container.textContent).toContain('mylogin')
    expect(container.querySelector('.MuiTypography-caption')).not.toBeNull()
  })
})
