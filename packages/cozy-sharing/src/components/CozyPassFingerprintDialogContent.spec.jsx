import { render } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import AppLike from '../../test/AppLike'
import { CozyPassFingerprintDialogContent } from './CozyPassFingerprintDialogContent'

describe('CozyPassFingerprintDialogContent', () => {
  const client = createMockClient({})
  client.options = {
    uri: 'foo.mycozy.cloud'
  }

  const setup = props => {
    return render(
      <AppLike client={client}>
        <CozyPassFingerprintDialogContent {...props} />
      </AppLike>
    )
  }

  it('shoud show the fingerprint from recipientConfirmationData', async () => {
    let props = {
      recipientConfirmationData: {
        name: 'SOME_NAME',
        email: 'SOME_EMAIL',
        fingerprintPhrase: 'SOME_FINGERPRINT'
      }
    }

    const { getByText } = setup(props)

    expect(getByText('SOME_FINGERPRINT')).toBeTruthy()
  })

  it('should show the instruction with the recipient name and email', () => {
    const props = {
      recipientConfirmationData: {
        name: 'Alice',
        email: 'alice@example.com',
        fingerprintPhrase: 'SOME_FINGERPRINT'
      }
    }

    const { container } = setup(props)

    expect(container.querySelector('p').textContent).toBe(
      "For security reasons, please verify Alice (alice@example.com)'s identity. To do this, contact Alice via the means of communication of your choice (call, text message, instant messaging app...) and verify their security code."
    )
  })

  it('should show the recipient name and email as plain text', () => {
    const props = {
      recipientConfirmationData: {
        name: '<img src=x onerror=alert(1)>',
        email: '[click](javascript:alert(1))',
        fingerprintPhrase: 'SOME_FINGERPRINT'
      }
    }

    const { container } = setup(props)

    expect(container.querySelector('img')).toBe(null)
    expect(container.querySelector('a')).toBe(null)
    const [name, email, nameAgain] = container.querySelectorAll('strong')
    expect(name.textContent).toBe('<img src=x onerror=alert(1)>')
    expect(email.textContent).toBe('[click](javascript:alert(1))')
    expect(nameAgain.textContent).toBe('<img src=x onerror=alert(1)>')
    expect(container.textContent).not.toContain('%{')
  })
})
