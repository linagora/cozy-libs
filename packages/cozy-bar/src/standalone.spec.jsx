import React from 'react'

import { BarLike } from '../test/lib/BarLike'

jest.mock('cozy-client', () => {
  const actual = jest.requireActual('cozy-client')
  const CozyClient = jest.requireActual('cozy-client/dist/CozyClient').default
  return {
    __esModule: true,
    default: CozyClient,
    CozyProvider: actual.CozyProvider,
    models: actual.models,
    useQuery: jest.fn().mockReturnValue({ data: [], fetchStatus: 'loaded' }),
    RealTimeQueries: () => null,
    useInstanceInfo: jest.fn().mockReturnValue({
      isLoaded: true,
      diskUsage: { data: { used: 0 } },
      instance: { data: {} },
      context: { data: {} }
    }),
    useFetchHomeShortcuts: jest.fn().mockReturnValue({ data: [], fetchStatus: 'loaded' })
  }
})

describe('cozy-bar standalone entry', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    document.body.innerHTML = ''
    delete window.twakeConfig
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('mounts the bar when twakeConfig has accessToken and cozyURL', async () => {
    window.twakeConfig = {
      accessToken: 'tok-123',
      cozyURL: 'http://cozy.localhost:8080',
      appSlug: 'tmail',
      appName: 'Twake Mail',
      iconURL: 'https://example.com/icon.png'
    }

    await import('./standalone')

    // Flush React effects
    jest.advanceTimersByTime(0)

    const barEl = document.getElementById('cozy-bar')
    expect(barEl).toBeInTheDocument()
  })
})
