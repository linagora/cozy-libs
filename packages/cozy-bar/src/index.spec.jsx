import React from 'react'
import { render, screen } from '@testing-library/react'

import { BarComponent, BarProvider, BarLeft } from './index'
import { BarLike } from '../test/lib/BarLike'

jest.mock('cozy-client', () => ({
  ...require.requireActual('cozy-client'),
  useQuery: jest.fn().mockReturnValue({ data: [], fetchStatus: 'loaded' }),
  RealTimeQueries: () => null,
  useInstanceInfo: jest.fn().mockReturnValue({
    isLoaded: true,
    diskUsage: { data: { used: 0 } },
    instance: { data: {} },
    context: { data: {} }
  })
}))

describe('The bar library', function() {
  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML =
      '<div role="application" ' +
      'data-cozy="{&quot;app&quot;:{&quot;editor&quot;: &quot;Cozy&quot;,&quot;icon&quot;: &quot;public/app-icon.svg&quot;,&quot;name&quot;: &quot;Drive&quot;,&quot;prefix&quot;: &quot;Cozy&quot;,&quot;slug&quot;: &quot;drive&quot;}}">' +
      '  The application will be here' +
      '</div>'
  })

  it('should render correctly the cozy-bar', () => {
    render(
      <BarLike>
        <BarComponent />
      </BarLike>
    )

    const buttonElement = screen.queryByTestId('buttonCozyHome')
    expect(buttonElement).toBeInTheDocument()
  })

  it('should render correctly the cozy-bar with customization', () => {
    render(
      <BarLike>
        <BarProvider>
          <BarComponent />
          <BarLeft>Custom text</BarLeft>
        </BarProvider>
      </BarLike>
    )

    const buttonElement = screen.queryByTestId('buttonCozyHome')
    expect(buttonElement).not.toBeInTheDocument()

    const currentApp = screen.getByText('Custom text')
    expect(currentApp).toBeInTheDocument()
  })
})
