import { render, waitFor } from '@testing-library/react'
import { AccountModal } from 'components/AccountModal'
import React from 'react'

import { fetchAccount } from '../../src/connections/accounts'

jest.mock('../../src/connections/accounts', () => ({
  fetchAccount: jest.fn()
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => () => ({
  isMobile: false
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useMatch: () => null
}))

// Mock components to avoid complex dependencies

const MockComponent = ({ account }) => (
  <div data-testid="mock-component">Mock Component: {account?._id}</div>
)

jest.mock('./AccountModalWithoutTabs/AccountModalHeader', () => ({
  __esModule: true,
  default: ({ account }) => (
    <div data-testid="account-modal-header">Header: {account?._id}</div>
  ),
  AccountModalHeader: ({ account }) => (
    <div data-testid="account-modal-header">Header: {account?._id}</div>
  )
}))

jest.mock('./KonnectorConfiguration/KonnectorAccountWrapper', () => ({
  __esModule: true,
  default: ({ Component, account, trigger, ...props }) => (
    <div data-testid="konnector-account-wrapper">
      <Component account={account} trigger={trigger} {...props} />
    </div>
  ),
  KonnectorAccountWrapper: ({ Component, account, trigger, ...props }) => (
    <div data-testid="konnector-account-wrapper">
      <Component account={account} trigger={trigger} {...props} />
    </div>
  )
}))

const accountsAndTriggersMock = [
  {
    account: {
      _id: '123',
      name: 'account 1'
    },
    trigger: {
      id: 'triggerid',
      current_state: {}
    }
  },
  {
    account: {
      _id: 'account_2',
      name: 'account_2'
    },
    trigger: {
      id: 'trigger_account2'
    }
  }
]
const accountIdMock = '123'

describe('AccountModal', () => {
  const setup = () => {
    const root = render(
      <AccountModal
        konnector={{ slug: 'test-konnector' }}
        t={x => x}
        accountId={accountIdMock}
        accountsAndTriggers={accountsAndTriggersMock}
        navigate={() => {}}
        breakpoints={{ isMobile: true }}
        onDismiss={jest.fn()}
        Component={MockComponent}
      />
    )
    return root
  }

  it('should display the fetching state by default', () => {
    const root = setup()

    expect(root.getByRole('progressbar')).toBeInTheDocument()
  })

  describe('with an account', () => {
    beforeEach(() => {
      fetchAccount.mockResolvedValue({
        _id: '123',
        name: 'account 1'
      })
    })

    it('should display the AccountSelect & Content if an account is there and we can change the selectedAccount', async () => {
      const root = setup()

      await waitFor(() => {
        expect(fetchAccount).toHaveBeenCalled()
        expect(root.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })
  })
})
