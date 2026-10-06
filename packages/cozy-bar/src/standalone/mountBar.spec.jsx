import '@testing-library/jest-dom'
import { fireEvent, waitFor, within } from '@testing-library/react'

const mockCozyClient = jest.fn()

jest.mock('cozy-client', () => {
  const actual = jest.requireActual('cozy-client')
  function MockCozyClient(options) {
    return mockCozyClient(options)
  }
  MockCozyClient.fetchPolicies = actual.default.fetchPolicies
  return {
    ...actual,
    __esModule: true,
    default: MockCozyClient,
    useInstanceInfo: () => ({
      isLoaded: true,
      instance: { data: { public_name: 'Alice', email: 'alice@example.com' } },
      diskUsage: { data: { used: 1, quota: 10 } },
      context: { data: {} }
    }),
    useQuery: () => ({ data: [], fetchStatus: 'loaded' }),
    useFetchHomeShortcuts: () => [],
    RealTimeQueries: () => null
  }
})

jest.mock('cozy-flags', () => {
  const actual = jest.requireActual('cozy-flags')
  actual.default.initializeFromRemote = () => Promise.resolve()
  return actual
})

jest.mock('cozy-ui-plus/dist/providers/CozyTheme', () =>
  jest.requireActual('cozy-ui/transpiled/react/providers/CozyTheme')
)

// jsdom has no CSSOM for styles in shadow roots, so JSS keeps the head
jest.mock('jss', () => {
  const actual = jest.requireActual('jss')
  return {
    ...actual,
    create: options => actual.create({ ...options, insertionPoint: undefined })
  }
})

jest.mock('./styles', () => ({
  getShadowStyleSheet: () => '',
  injectFonts: () => {}
}))

const credentials = {
  idToken: 'id-token-1',
  cozyURL: 'http://alice.cozy.localhost:8080'
}

// Response of the token_exchange of cozy-stack
const mockExchange = (accessToken = 'access-1') =>
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({ access_token: accessToken, refresh_token: 'refresh-1' })
  })

const config = { appSlug: 'mail', appName: 'Twake Mail', onLogOut: () => {} }

// The bar also creates a client without credentials for its public state
const getOAuthClientCalls = () =>
  mockCozyClient.mock.calls.filter(([options]) => options.oauth)

describe('mountBar', () => {
  let mountBar
  let setCredentials
  let unmountBar
  let setLocale
  let setTheme
  let WAITING_TIMEOUT
  let client

  const getBar = () => within(document.getElementById('cozy-bar').shadowRoot)

  beforeEach(() => {
    // The bar keeps its client in module state
    jest.resetModules()
    const { createMockClient } = require('cozy-client')
    ;({
      mountBar,
      setCredentials,
      unmountBar,
      setLocale,
      setTheme,
      WAITING_TIMEOUT
    } = require('./mountBar'))

    client = createMockClient({
      clientOptions: { uri: credentials.cozyURL }
    })
    jest.spyOn(client, 'registerPlugin').mockImplementation(() => {})
    // The bar creates an OAuth client, the mock client is not one
    jest.spyOn(client.getStackClient(), 'setToken').mockImplementation(() => {})
    mockCozyClient.mockReset().mockReturnValue(client)
    global.fetch = jest.fn()
    mockExchange()
  })

  afterEach(() => {
    unmountBar()
    jest.useRealTimers()
  })

  it('renders in a shadow root prepended to the body', async () => {
    document.body.innerHTML = '<main></main>'

    mountBar(config)

    const host = document.body.firstChild
    expect(host.id).toBe('cozy-bar')
    expect(host.shadowRoot).not.toBe(null)
    await waitFor(() =>
      expect(getBar().queryByTestId('coz-bar-wrapper')).toBeInTheDocument()
    )
  })

  it('is public without waiting when `public` is set', async () => {
    mountBar({ ...config, public: true })

    await waitFor(() =>
      expect(getBar().queryByTestId('coz-bar-wrapper')).toBeInTheDocument()
    )
    expect(getBar().queryByTestId('coz-bar-skeleton-avatar')).toBe(null)
    expect(getBar().queryByTestId('user-menu-button')).toBe(null)
  })

  it('is waiting by default', async () => {
    mountBar(config)

    await waitFor(() =>
      expect(
        getBar().queryByTestId('coz-bar-skeleton-avatar')
      ).toBeInTheDocument()
    )
  })

  it('falls back to public when credentials never arrive', () => {
    jest.useFakeTimers()
    // act() of the React instance used by the bar flushes renders synchronously
    const { act } = require('react-dom/test-utils')
    global.IS_REACT_ACT_ENVIRONMENT = true

    act(() => mountBar(config))
    expect(
      getBar().queryByTestId('coz-bar-skeleton-avatar')
    ).toBeInTheDocument()

    act(() => jest.advanceTimersByTime(WAITING_TIMEOUT))
    expect(getBar().queryByTestId('coz-bar-skeleton-avatar')).toBe(null)
    expect(getBar().queryByTestId('coz-bar-wrapper')).toBeInTheDocument()

    global.IS_REACT_ACT_ENVIRONMENT = false
  })

  it('is ready once credentials are set', async () => {
    mountBar(config)

    await setCredentials(credentials)

    await waitFor(() =>
      expect(getBar().queryByTestId('user-menu-button')).toBeInTheDocument()
    )
    expect(getBar().queryByTestId('coz-bar-skeleton-avatar')).toBe(null)
    expect(getOAuthClientCalls()).toEqual([
      [expect.objectContaining({ uri: credentials.cozyURL })]
    ])
  })

  it('exchanges the id token on the Cozy', async () => {
    mountBar(config)

    await setCredentials(credentials)

    expect(global.fetch).toHaveBeenCalledWith(
      new URL('/auth/token_exchange', credentials.cozyURL),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id_token: 'id-token-1', exchange_type: 'app' })
      })
    )
    expect(getOAuthClientCalls()).toEqual([
      [
        expect.objectContaining({
          token: expect.objectContaining({ access_token: 'access-1' })
        })
      ]
    ])
  })

  it('is ready once mounted with an id token', async () => {
    await mountBar({ ...config, ...credentials })

    await waitFor(() =>
      expect(getBar().queryByTestId('user-menu-button')).toBeInTheDocument()
    )
    expect(getOAuthClientCalls()).toHaveLength(1)
  })

  it('requires cozyURL with an id token', () => {
    expect(() => mountBar({ ...config, idToken: 'id-token-1' })).toThrow(
      TypeError
    )
    expect(document.getElementById('cozy-bar')).toBe(null)
  })

  it('is public and rejects when the exchange fails', async () => {
    global.fetch.mockReset().mockResolvedValueOnce({ ok: false, status: 400 })
    mountBar(config)

    await expect(setCredentials(credentials)).rejects.toThrow('400')

    await waitFor(() =>
      expect(getBar().queryByTestId('coz-bar-skeleton-avatar')).toBe(null)
    )
    expect(getBar().queryByTestId('user-menu-button')).toBe(null)
    expect(getOAuthClientCalls()).toHaveLength(0)
  })

  it('updates the token of the existing client on new credentials', async () => {
    mountBar(config)
    await setCredentials(credentials)

    mockExchange('access-2')
    await setCredentials({ ...credentials, idToken: 'id-token-2' })

    expect(getOAuthClientCalls()).toHaveLength(1)
    expect(client.getStackClient().setToken).toHaveBeenCalledWith(
      expect.objectContaining({ access_token: 'access-2' })
    )
  })

  it('requires onLogOut unless the page is public', () => {
    const { onLogOut, ...withoutLogOut } = config

    expect(() => mountBar(withoutLogOut)).toThrow(TypeError)
    expect(document.getElementById('cozy-bar')).toBe(null)
    expect(() => mountBar({ ...withoutLogOut, public: true })).not.toThrow()
  })

  it('calls onLogOut from the log out item', async () => {
    const onLogOut = jest.fn()
    mountBar({ ...config, onLogOut })
    await setCredentials(credentials)

    fireEvent.click(await getBar().findByTestId('user-menu-button'))
    fireEvent.click(await getBar().findByTestId('user-menu-logout'))

    expect(onLogOut).toHaveBeenCalledTimes(1)
  })

  it('translates the bar in the given locale', async () => {
    mountBar({ ...config, locale: 'fr' })
    await setCredentials(credentials)

    fireEvent.click(await getBar().findByTestId('user-menu-button'))

    expect(await getBar().findByTestId('user-menu-logout')).toHaveTextContent(
      'Se déconnecter'
    )
  })

  it('switches the language of the mounted bar with setLocale', async () => {
    mountBar(config)
    await setCredentials(credentials)
    fireEvent.click(await getBar().findByTestId('user-menu-button'))
    expect(await getBar().findByTestId('user-menu-logout')).toHaveTextContent(
      'Log out'
    )

    setLocale('fr')
    await waitFor(() =>
      expect(getBar().queryByTestId('user-menu-logout')).toHaveTextContent(
        'Se déconnecter'
      )
    )

    setLocale('xx')
    await waitFor(() =>
      expect(getBar().queryByTestId('user-menu-logout')).toHaveTextContent(
        'Log out'
      )
    )
    expect(getOAuthClientCalls()).toHaveLength(1)
  })

  it('ignores setLocale before mount', () => {
    expect(() => setLocale('fr')).not.toThrow()
    expect(document.getElementById('cozy-bar')).toBe(null)
  })

  it('uses the theme of the host app and switches it with setTheme', async () => {
    const getShadowRoot = () => document.getElementById('cozy-bar').shadowRoot

    mountBar({ ...config, theme: 'dark' })
    await waitFor(() =>
      expect(getShadowRoot().querySelector('.TwakeTheme--dark')).not.toBe(null)
    )

    setTheme('light')
    await waitFor(() =>
      expect(getShadowRoot().querySelector('.TwakeTheme--light')).not.toBe(null)
    )
  })

  it('ignores setTheme before mount', () => {
    expect(() => setTheme('dark')).not.toThrow()
    expect(document.getElementById('cozy-bar')).toBe(null)
  })

  it('displays the icons of the host app before and after credentials', async () => {
    const icons = { appIcon: '/icon.svg', appTextIcon: '/icon-text.svg' }
    const getIconSources = () =>
      [
        ...document
          .getElementById('cozy-bar')
          .shadowRoot.querySelectorAll(
            '.coz-bar-app-icon, .coz-bar-app-text-icon'
          )
      ].map(img => img.getAttribute('src'))

    mountBar({ ...config, ...icons })
    await waitFor(() =>
      expect(getIconSources()).toEqual(['/icon.svg', '/icon-text.svg'])
    )

    await setCredentials(credentials)
    await waitFor(() =>
      expect(getBar().queryByTestId('user-menu-button')).toBeInTheDocument()
    )
    expect(getIconSources()).toEqual(['/icon.svg', '/icon-text.svg'])
  })
})
