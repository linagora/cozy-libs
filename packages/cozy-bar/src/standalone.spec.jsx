const flushMicrotasks = () => new Promise(resolve => resolve())

describe('cozy-bar standalone entry', () => {
  let mockMountBar

  beforeEach(() => {
    jest.useFakeTimers()
    document.body.innerHTML = ''
    delete window.twakeConfig
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    mockMountBar = jest.fn()
    jest.doMock('./mountBar', () => ({ mountBar: mockMountBar }))
    jest.resetModules()
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

    require('./standalone')

    // Flush microtasks through _asyncToGenerator's promise chain
    await flushMicrotasks()
    await flushMicrotasks()

    expect(mockMountBar).toHaveBeenCalledWith(window.twakeConfig)
  })

  it('does nothing and warns when twakeConfig is missing after 30s', () => {
    require('./standalone')

    jest.advanceTimersByTime(29000)

    expect(mockMountBar).not.toHaveBeenCalled()
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'
    )
  })

  it('mounts when twakeConfig appears after a delay', async () => {
    require('./standalone')

    jest.advanceTimersByTime(2000)
    expect(mockMountBar).not.toHaveBeenCalled()

    window.twakeConfig = {
      accessToken: 'tok-late',
      cozyURL: 'http://cozy.localhost:8080'
    }

    jest.advanceTimersByTime(1000)

    await flushMicrotasks()
    await flushMicrotasks()

    expect(mockMountBar).toHaveBeenCalledWith(window.twakeConfig)
  })
})
