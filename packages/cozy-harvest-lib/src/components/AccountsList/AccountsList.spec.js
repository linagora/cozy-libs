import { render } from '@testing-library/react'
import { AccountsList } from 'components/AccountsList/AccountsList'
import React from 'react'

// Mock Status component to avoid complex FlowProvider dependencies
jest.mock('./Status', () => ({
  __esModule: true,
  default: ({ trigger }) => (
    <div data-testid="status-mock">Status: {trigger?._id}</div>
  ),
  Status: ({ trigger }) => (
    <div data-testid="status-mock">Status: {trigger?._id}</div>
  )
}))

describe('AccountsList', () => {
  it('should render', () => {
    const { container } = render(
      <AccountsList
        accounts={[
          {
            account: { _id: 'account-1' },
            trigger: { _id: 'trigger-1' }
          },
          {
            account: { _id: 'account-2' },
            trigger: { _id: 'trigger-2' }
          }
        ]}
        konnector={{
          name: 'test-konnector',
          vendor_link: 'test konnector link'
        }}
        addAccount={jest.fn()}
        onPick={jest.fn()}
        t={jest.fn(str => str)}
      />
    )
    expect(container).toBeTruthy()
    expect(container.textContent).toContain('account-1')
    expect(container.textContent).toContain('account-2')
  })
})
