import { render, waitFor } from '@testing-library/react'
import React from 'react'

import { useBanners } from './useBanners'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('cozy-client/dist/models/banner', () => ({
  BANNERS_DOCTYPE: 'io.cozy.banners',
  getActiveBanners: jest.fn(),
  dismiss: jest.fn()
}))

const { useClient } = require('cozy-client')
const { getActiveBanners } = require('cozy-client/dist/models/banner')

const Probe = () => {
  const { banners } = useBanners()
  return <div data-testid="count">{banners.length}</div>
}

const setup = realtime => {
  useClient.mockReturnValue({ plugins: realtime ? { realtime } : {} })
  return render(<Probe />)
}

describe('useBanners', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getActiveBanners.mockResolvedValue([])
  })

  it('subscribes to the banner events and drops them on unmount', async () => {
    const realtime = { subscribe: jest.fn(), unsubscribe: jest.fn() }
    const { unmount } = setup(realtime)

    await waitFor(() => expect(realtime.subscribe).toHaveBeenCalledTimes(3))
    expect(realtime.subscribe.mock.calls.map(([event]) => event)).toEqual([
      'created',
      'updated',
      'deleted'
    ])
    expect(realtime.subscribe).toHaveBeenCalledWith(
      'created',
      'io.cozy.banners',
      expect.any(Function)
    )

    unmount()
    expect(realtime.unsubscribe.mock.calls).toEqual(
      realtime.subscribe.mock.calls
    )
  })

  it('re-reads when a realtime event arrives', async () => {
    const realtime = { subscribe: jest.fn(), unsubscribe: jest.fn() }
    const { findByTestId, getByTestId } = setup(realtime)

    await findByTestId('count')
    expect(getActiveBanners).toHaveBeenCalledTimes(1)

    getActiveBanners.mockResolvedValue([{ bannerId: 'demo' }])
    const [, , handler] = realtime.subscribe.mock.calls[1]
    handler()

    await waitFor(() => expect(getByTestId('count')).toHaveTextContent('1'))
  })

  it('still renders without the realtime plugin', async () => {
    const { findByTestId } = setup(null)
    await expect(findByTestId('count')).resolves.toHaveTextContent('0')
  })

  it('renders when the realtime plugin is registered but logged out', async () => {
    const loggedOut = () => {
      throw new Error(
        'Unable to use realtime while cozy-client is not logged in'
      )
    }
    const { findByTestId, unmount } = setup({
      subscribe: loggedOut,
      unsubscribe: loggedOut
    })

    await expect(findByTestId('count')).resolves.toHaveTextContent('0')
    expect(() => unmount()).not.toThrow()
  })
})
