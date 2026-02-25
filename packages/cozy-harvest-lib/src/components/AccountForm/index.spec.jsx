/* eslint-env jest */
import { fireEvent, render, act } from '@testing-library/react'
import { AccountForm } from 'components/AccountForm'
import enLocale from 'locales/en.json'
import Polyglot from 'node-polyglot'
import React from 'react'

import AppLike from '../../../test/AppLike'

const polyglot = new Polyglot()
polyglot.extend(enLocale)

const t = polyglot.t.bind(polyglot)
const fixtures = {
  konnector: {
    fields: {
      username: {
        type: 'text'
      },
      passphrase: {
        type: 'password'
      }
    }
  },
  clientSideKonnector: {
    clientSide: true,
    name: 'testkonnector',
    fields: {}
  },
  konnectorWithOptionalFields: {
    fields: {
      test: {
        required: false,
        type: 'text'
      }
    }
  },
  konnectorWithIdendifierAndSecret: {
    fields: {
      identifier: {
        type: 'text'
      },
      secret: {
        type: 'password'
      }
    }
  },
  konnectorWithAdvancedField: {
    fields: {
      advancedFields: {
        folderPath: {
          advanced: true,
          isRequired: false
        }
      },
      username: {
        type: 'text'
      }
    }
  },
  account: {
    auth: {
      username: 'Toto',
      credentials_encrypted:
        'bmFjbGj8JQfzzfTQ2aGKTpI+HI9N8xKAQqPTPD6/84x5GyiHm2hdn7N6rO8cLTCnkdsnd2eFWJRf'
    }
  }
}

const onSubmit = jest.fn()

jest.mock('cozy-device-helper', () => ({
  ...require.requireActual('cozy-device-helper'),
  isMobile: jest.fn()
}))

jest.mock('components/KonnectorIcon', () => {
  const KonnectorIcon = () => <div>KonnectorIcon</div>

  return KonnectorIcon
})

describe('AccountForm', () => {
  beforeEach(() => {
    onSubmit.mockClear()
  })

  const setup = ({ error, showError, account, konnector } = {}) => {
    const flowState = { error }
    const { container } = render(
      <AppLike>
        <AccountForm
          flowState={flowState}
          account={account}
          konnector={konnector || fixtures.konnector}
          onSubmit={onSubmit}
          showError={showError}
          t={t}
          fieldOptions={{}}
        />
      </AppLike>
    )
    return { container }
  }

  it('should render normally when client side konnector with launcher', () => {
    const originalCozy = window.cozy
    try {
      window.cozy = {
        ClientConnectorLauncher: 'react-native'
      }
      const { container } = setup({ konnector: fixtures.clientSideKonnector })
      expect(container).toBeTruthy()
    } finally {
      window.cozy = originalCozy
    }
  })

  describe('Submit Button', () => {
    it('should call onSubmit on click', () => {
      const { container } = setup({
        konnector: fixtures.konnectorWithOptionalFields
      })
      const submitButton = container.querySelector('[data-testid="submit-btn"]')
      expect(submitButton).not.toBeNull()
      expect(submitButton).toBeEnabled()
      fireEvent.click(submitButton)
      expect(onSubmit).toHaveBeenCalled()
    })

    it('should be disabled if there is required field empty', () => {
      const konnector = {
        fields: {
          test: {
            type: 'text'
          }
        }
      }

      const { container } = setup({ konnector })
      const submitButton = container.querySelector('[data-testid="submit-btn"]')
      expect(submitButton).not.toBeNull()
      expect(submitButton).toBeDisabled()
    })

    it("should be enabled if required field isn't empty", () => {
      const konnector = {
        fields: {
          test: {
            default: 'test',
            type: 'text'
          }
        }
      }
      const { container } = setup({ konnector })
      const submitButton = container.querySelector('[data-testid="submit-btn"]')
      expect(submitButton).not.toBeNull()
      expect(submitButton).toBeEnabled()
    })

    it("should be enabled if fields isn't required", () => {
      const { container } = setup({
        konnector: fixtures.konnectorWithOptionalFields
      })
      const submitButton = container.querySelector('[data-testid="submit-btn"]')
      expect(submitButton).not.toBeNull()
      expect(submitButton).toBeEnabled()
    })

    it('should be enabled when an error exists', async () => {
      const account = {}
      const error = new Error('Test error')
      let container
      await act(async () => {
        const result = setup({ account, error })
        container = result.container
      })
      const submitButton = container.querySelector('[data-testid="submit-btn"]')
      expect(submitButton).not.toBeNull()
      expect(submitButton).toBeEnabled()
    })
  })

  describe('with read-only identifier', () => {
    it('should render a read-only identifier field if the account has a relationship with a vault cipher and props.readOnlyIdentifier is true', () => {
      const accountWithCipher = {
        ...fixtures.account,
        relationships: {
          vaultCipher: {
            _id: 'fake-cipher-id',
            _type: 'com.bitwarden.ciphers',
            _protocol: 'bitwarden'
          }
        }
      }
      const flowState = {}
      const { container } = render(
        <AppLike>
          <AccountForm
            flowState={flowState}
            t={t}
            konnector={fixtures.konnector}
            onSubmit={onSubmit}
            account={accountWithCipher}
            readOnlyIdentifier={true}
            fieldOptions={{}}
          />
        </AppLike>
      )

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="username"]'
      )
      expect(hiddenInput).toBeTruthy()
    })
    it('should render a read-only identifier field even with advancedFields field in the manifest', () => {
      const accountWithCipher = {
        ...fixtures.account,
        relationships: {
          vaultCipher: {
            _id: 'fake-cipher-id',
            _type: 'com.bitwarden.ciphers',
            _protocol: 'bitwarden'
          }
        }
      }
      const flowState = {}
      const { container } = render(
        <AppLike>
          <AccountForm
            flowState={flowState}
            t={t}
            konnector={fixtures.konnectorWithAdvancedField}
            onSubmit={onSubmit}
            account={accountWithCipher}
            readOnlyIdentifier={true}
            fieldOptions={{}}
          />
        </AppLike>
      )

      const hiddenInput = container.querySelector(
        'input[type="hidden"][name="username"]'
      )
      expect(hiddenInput).toBeTruthy()
    })
  })

  describe('fieldOptions', () => {
    const setup = fieldOptions => {
      const root = render(
        <AppLike>
          <AccountForm
            flowState={{}}
            t={t}
            konnector={fixtures.konnectorWithIdendifierAndSecret}
            onSubmit={onSubmit}
            account={fixtures.account}
            readOnlyIdentifier={true}
            fieldOptions={fieldOptions}
          />
        </AppLike>
      )
      return root
    }

    it('should render password placeholder', () => {
      const fieldOptions = {
        displaySecretPlaceholder: true,
        focusSecretField: false
      }
      const root = setup(fieldOptions)
      expect(root.getByPlaceholderText('*************')).toBeTruthy()
    })

    it('should not render password placeholder', () => {
      const fieldOptions = {
        displaySecretPlaceholder: false
      }
      const root = setup(fieldOptions)
      expect(root.queryByPlaceholderText('*************')).toBeFalsy()
    })

    it('should not render password placeholder with focus', () => {
      const fieldOptions = {
        focusSecretField: true
      }
      const root = setup(fieldOptions)
      expect(root.queryByPlaceholderText('*************')).toBeFalsy()
    })

    it('should not render password placeholder with values in identifier', () => {
      const fieldOptions = {}
      const root = setup(fieldOptions)
      const identifier = root.getAllByDisplayValue('')[0]
      fireEvent.change(identifier, { target: { value: 'newvalue' } })
      expect(root.queryByPlaceholderText('*************')).toBeFalsy()
    })
  })
})
