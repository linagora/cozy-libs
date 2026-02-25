import { render } from '@testing-library/react'
import React from 'react'

import CozyClient, { CozyProvider } from 'cozy-client'

import KonnectorIcon from './KonnectorIcon'

describe('KonnectorIcon', () => {
  let originalConsoleError

  beforeEach(() => {
    // eslint-disable-next-line no-console
    originalConsoleError = console.error
    // eslint-disable-next-line no-console
    console.error = jest.fn(function () {
      throw new Error('console.error should not be called during tests')
    })
  })

  afterEach(() => {
    // eslint-disable-next-line no-console
    console.error = originalConsoleError
  })

  const setup = ({ konnector, konnectorSlug } = {}) => {
    const client = new CozyClient()
    const root = render(
      <CozyProvider client={client}>
        <KonnectorIcon
          client={client}
          konnector={konnector}
          konnectorSlug={konnectorSlug}
        />
      </CozyProvider>
    )
    return { root }
  }

  it('should render correctly with konnector prop', () => {
    const { root } = setup({ konnector: { slug: 'konn-1' } })
    const svgElement = root.container.querySelector('svg')
    expect(svgElement).not.toBeNull()
  })

  it('should render correctly with konnectorSlug prop', () => {
    const { root } = setup({ konnectorSlug: 'konn-1' })
    const svgElement = root.container.querySelector('svg')
    expect(svgElement).not.toBeNull()
  })
})
