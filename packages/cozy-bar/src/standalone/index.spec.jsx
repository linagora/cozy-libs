const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('cozy-bar standalone entry', () => {
  let mockMountBar
  let mockSetCredentials
  let mockSetLocale
  let mockSetTheme

  beforeEach(() => {
    document.body.innerHTML = ''
    delete window.TwakeBar
    mockMountBar = jest.fn()
    mockSetCredentials = jest.fn()
    mockSetLocale = jest.fn()
    mockSetTheme = jest.fn()
    jest.doMock('./styles', () => ({
      injectThemeVariables: jest.fn(),
      adoptHeadStyles: jest.fn()
    }))
    jest.doMock('./mountBar', () => ({
      mountBar: mockMountBar,
      setCredentials: mockSetCredentials,
      setLocale: mockSetLocale,
      setTheme: mockSetTheme
    }))
    jest.resetModules()
  })

  afterEach(() => {
    jest.dontMock('./mountBar')
    jest.dontMock('./styles')
    jest.restoreAllMocks()
    delete window.TwakeBar
  })

  it('exposes window.TwakeBar with its API synchronously', () => {
    require('./index')

    expect(window.TwakeBar).toBeDefined()
    expect(typeof window.TwakeBar.mount).toBe('function')
    expect(typeof window.TwakeBar.setCredentials).toBe('function')
    expect(typeof window.TwakeBar.setLocale).toBe('function')
    expect(typeof window.TwakeBar.setTheme).toBe('function')
  })

  it('mount delegates to mountBar once loaded', async () => {
    require('./index')

    const cfg = {
      appSlug: 'mail',
      appName: 'Twake Mail',
      appIcon: 'https://example.com/icon.png'
    }
    window.TwakeBar.mount(cfg)

    await flush()

    expect(mockMountBar).toHaveBeenCalledWith(cfg)
  })

  it('setCredentials delegates to setCredentials once loaded', async () => {
    require('./index')

    const tokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      cozyURL: 'http://cozy.localhost:8080'
    }
    window.TwakeBar.setCredentials(tokens)

    await flush()

    expect(mockSetCredentials).toHaveBeenCalledWith(tokens)
  })

  it('applies queued mount then credentials in order', async () => {
    require('./index')

    const cfg = { appSlug: 'mail', appName: 'Twake Mail' }
    const tokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      cozyURL: 'http://cozy.localhost:8080'
    }
    window.TwakeBar.mount(cfg)
    window.TwakeBar.setCredentials(tokens)

    await flush()

    expect(mockMountBar).toHaveBeenCalledWith(cfg)
    expect(mockSetCredentials).toHaveBeenCalledWith(tokens)
    expect(mockMountBar.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetCredentials.mock.invocationCallOrder[0]
    )
  })

  it('applies queued mount then locale in order', async () => {
    require('./index')

    const cfg = { appSlug: 'mail', appName: 'Twake Mail' }
    window.TwakeBar.mount(cfg)
    window.TwakeBar.setLocale('fr')

    await flush()

    expect(mockMountBar).toHaveBeenCalledWith(cfg)
    expect(mockSetLocale).toHaveBeenCalledWith('fr')
    expect(mockMountBar.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetLocale.mock.invocationCallOrder[0]
    )
  })

  it('applies queued mount then theme in order', async () => {
    require('./index')

    const cfg = { appSlug: 'mail', appName: 'Twake Mail' }
    window.TwakeBar.mount(cfg)
    window.TwakeBar.setTheme('dark')

    await flush()

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(mockMountBar.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetTheme.mock.invocationCallOrder[0]
    )
  })
})
