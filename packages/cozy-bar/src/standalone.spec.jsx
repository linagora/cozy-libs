import React from 'react'

import { BarLike } from '../test/lib/BarLike'

jest.mock('cozy-client', () => {
  const CozyClient = jest.requireActual('cozy-client/dist/CozyClient').default
  const CozyProvider = jest.requireActual('cozy-client/dist/Provider').default
  const useClient = jest.requireActual('cozy-client/dist/hooks/useClient').default
  const models = jest.requireActual('cozy-client/dist/models').default || jest.requireActual('cozy-client/dist/models')
  return {
    __esModule: true,
    default: CozyClient,
    CozyProvider,
    useClient,
    models,
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
    jest.resetModules()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('mounts the bar when twakeConfig has accessToken and cozyURL', () => {
    window.twakeConfig = {
      accessToken: 'tok-123',
      cozyURL: 'http://cozy.localhost:8080',
      appSlug: 'tmail',
      appName: 'Twake Mail',
      iconURL: 'https://example.com/icon.png'
    }

    require('./standalone')

    // Flush React effects
    jest.advanceTimersByTime(0)

    const barEl = document.getElementById('cozy-bar')
    expect(barEl).toBeInTheDocument()
  })

  it('does nothing and warns when twakeConfig is missing after 30s', () => {
    require('./standalone')

    // 29 interval ticks (29000ms) → attempts = 1 + 29 = 30 → warn fires
    jest.advanceTimersByTime(29000)

    expect(document.getElementById('cozy-bar')).toBe(null)
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'
    )
  })
})
