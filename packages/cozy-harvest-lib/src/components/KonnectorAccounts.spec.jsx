import { render, screen, waitFor } from '@testing-library/react'
import { KonnectorAccounts } from 'components/KonnectorAccounts'
import React from 'react'

import CozyClient from 'cozy-client'

import { fetchAccountsFromTriggers } from '../../src/connections/accounts'
import AppLike from '../../test/AppLike'

jest.mock(
  'cozy-realtime',
  () =>
    function () {
      return {
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      }
    }
)
jest.mock('../../src/connections/accounts', () => ({
  fetchAccountsFromTriggers: jest.fn()
}))

jest.mock('../../src/connections/triggers', () => ({
  fetchTrigger: jest.fn()
}))

describe('KonnectorAccounts', () => {
  const client = new CozyClient({})
  client.plugins.realtime = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn()
  }

  const mockChildren = jest.fn(accounts => (
    <div data-testid="children-render">
      {accounts ? accounts.length : 0} accounts
    </div>
  ))

  const renderComponent = (props = {}) => {
    const defaultProps = {
      konnector: {},
      location: {},
      client: client,
      t: key => key
    }

    return render(
      <AppLike client={client}>
        <KonnectorAccounts {...defaultProps} {...props}>
          {mockChildren}
        </KonnectorAccounts>
      </AppLike>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockChildren.mockClear()
  })

  it('should show a spinner when loading', () => {
    fetchAccountsFromTriggers.mockImplementation(() => new Promise(() => {}))

    renderComponent()

    expect(screen.getByRole('progressbar')).toBeInTheDocument()

    expect(mockChildren).not.toHaveBeenCalled()
  })

  it('should call children with the accounts and triggers list after loading', async () => {
    const trigger = { _id: 'abc', error: null }
    const accountsData = [
      {
        account: { _type: 'io.cozy.accounts', _id: '123' },
        trigger
      }
    ]

    fetchAccountsFromTriggers.mockResolvedValueOnce(accountsData)

    renderComponent({
      konnector: { triggers: { data: [trigger] } }
    })

    await waitFor(() => {
      expect(fetchAccountsFromTriggers).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockChildren).toHaveBeenCalledWith(accountsData)
    })

    expect(screen.getByTestId('children-render')).toHaveTextContent(
      '1 accounts'
    )
  })

  it('should show error message when fetch fails', async () => {
    const error = new Error('Failed to fetch accounts')
    fetchAccountsFromTriggers.mockRejectedValueOnce(error)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('modal.accounts.error.title')).toBeInTheDocument()
    })

    expect(mockChildren).not.toHaveBeenCalled()
  })
})
