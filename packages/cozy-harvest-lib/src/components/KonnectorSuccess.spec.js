import { render } from '@testing-library/react'
import { KonnectorSuccess } from 'components/KonnectorSuccess'
import React from 'react'

import CozyClient from 'cozy-client'

import AppLike from '../../test/AppLike'

describe('KonnectorSuccess', () => {
  const setup = ({ isBankingKonnector, folder_to_save } = {}) => {
    const client = new CozyClient({})
    const konnector = isBankingKonnector
      ? {
          name: 'test-konnector',
          vendor_link: 'test konnector link',
          data_types: ['bankAccounts']
        }
      : {
          name: 'test-konnector',
          vendor_link: 'test konnector link'
        }
    const message = folder_to_save ? { folder_to_save: '/path' } : {}

    return render(
      <AppLike client={client}>
        <KonnectorSuccess
          accounts={[
            {
              account: { _id: 'account-1' },
              trigger: {
                _id: 'trigger-1',
                message: message
              }
            },
            {
              account: { _id: 'account-2' },
              trigger: { _id: 'trigger-2' }
            }
          ]}
          konnector={konnector}
          accountId="account-1"
          title="Fake title"
          successButtonLabel="Fake label"
          error={null}
          onDone={() => {}}
          onDismiss={() => {}}
          t={jest.fn(str => str)}
        />
      </AppLike>
    )
  }

  it('should render the success image', () => {
    const { container } = setup()
    expect(container.textContent).toContain('account.success.title')
  })

  it('should not show drive if trigger has no folder_to_save', () => {
    const { container } = setup()
    expect(container.textContent).toContain('account.success.connect')
    expect(container.textContent).not.toContain('account.success.drive')
  })

  it('should show banks if connector has datatypes with bankAccounts', () => {
    const { container } = setup({ isBankingKonnector: true })
    expect(container.textContent).toContain('See my accounts in')
  })

  it('should show apps in the correct order', () => {
    const { container } = setup({
      isBankingKonnector: true,
      folder_to_save: '123'
    })
    expect(container.textContent).toContain('See my accounts in')
  })
})
