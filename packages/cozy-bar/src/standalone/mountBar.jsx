import { Bar } from 'components/Bar'
import { locales } from 'components/useI18n'
import { create } from 'jss'
import logger from 'lib/logger'
import React from 'react'
import { createRoot } from 'react-dom/client'

import CozyClient, { CozyProvider } from 'cozy-client'
import flag from 'cozy-flags'
import { RealtimePlugin } from 'cozy-realtime'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import {
  StylesProvider,
  ThemeProvider,
  jssPreset
} from 'cozy-ui/transpiled/react/styles'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import { I18n } from 'twake-i18n'

import { getShadowStyleSheet, injectFonts } from './styles'

// If credentials never arrive while `waiting`, the bar falls back to `public`
// so the user is not stuck on a skeleton forever.
export const WAITING_TIMEOUT = 30000

let bar = null
let client = null
let isClientReady = false
// Bar queries need a client in context even before credentials, when their
// queries are disabled
let publicClient = null

const getDictionary = lang => locales[lang] ?? {}

const StandaloneBar = ({ config, status, jss, withShadowPortal }) => {
  const lang = locales[config.locale] ? config.locale : 'en'

  return (
    <StylesProvider jss={jss}>
      <I18n lang={lang} dictRequire={getDictionary}>
        <BreakpointsProvider>
          {/* The theme comes from the host app, not from io.cozy.settings */}
          <CozyTheme ignoreCozySettings type={config.theme}>
            <ThemeProvider theme={withShadowPortal}>
              <CozyProvider client={client || publicClient}>
                <Bar
                  isPublic={status !== 'ready'}
                  appSlug={config.appSlug}
                  appName={config.appName}
                  appIcon={config.appIcon}
                  appTextIcon={config.appTextIcon}
                  onLogOut={config.onLogOut}
                  searchOptions={{ enabled: false }}
                  barRight={
                    status === 'waiting' && (
                      <div
                        className="coz-bar-skeleton-avatar"
                        data-testid="coz-bar-skeleton-avatar"
                      />
                    )
                  }
                />
              </CozyProvider>
            </ThemeProvider>
          </CozyTheme>
        </BreakpointsProvider>
      </I18n>
    </StylesProvider>
  )
}

function render() {
  bar.root.render(
    <StandaloneBar
      config={bar.config}
      status={bar.status}
      jss={bar.jss}
      withShadowPortal={bar.withShadowPortal}
    />
  )
}

function setStatus(status) {
  if (!bar) return
  clearTimeout(bar.waitingTimeout)
  bar.status = status
  if (status === 'waiting') {
    bar.waitingTimeout = setTimeout(() => setStatus('public'), WAITING_TIMEOUT)
  }
  render()
}

export function unmountBar() {
  if (!bar) return
  clearTimeout(bar.waitingTimeout)
  bar.root.unmount()
  bar.host.remove()
  bar = null
}

/**
 * Renders the bar in a shadow root, in a host element prepended to the body.
 *
 * @param {object} config
 * @param {boolean} [config.public] - The page is public: do not wait for credentials
 * @param {string} config.appSlug
 * @param {string} config.appName
 * @param {string} [config.appIcon] - Icon URL, served by the host app
 * @param {string} [config.appTextIcon] - Text logo URL, served by the host app
 * @param {string} [config.locale] - Language of the bar, 'en' by default
 * @param {'light'|'dark'} [config.theme] - Theme of the bar, the device one by default
 * @param {Function} [config.onLogOut] - Called by the log out item. Required
 * unless the page is public: the host app owns the logout
 * @param {string} [config.idToken] - OIDC id token of the user, exchanged by
 * the bar for a token of its Cozy. Can also be given later to setCredentials
 * @param {string} [config.cozyURL] - URL of the user's Cozy, required with idToken
 * @returns {Promise<void>|undefined} With idToken, the setCredentials promise
 */
export function mountBar({ idToken, cozyURL, ...config }) {
  if (!config.public && typeof config.onLogOut !== 'function') {
    throw new TypeError('[cozy-bar] mount: onLogOut is required unless public')
  }
  if (idToken && !cozyURL) {
    throw new TypeError('[cozy-bar] mount: cozyURL is required with idToken')
  }
  unmountBar()
  publicClient = publicClient || new CozyClient({})

  const host = document.createElement('div')
  host.id = 'cozy-bar'
  // Flutter web listens to `pointermove` on window: without this, hovering the
  // bar also triggers hover states in the Flutter app below it. Other events
  // still bubble so click-away listeners keep working.
  host.addEventListener('pointermove', e => e.stopPropagation())

  const shadowRoot = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = getShadowStyleSheet()
  const container = document.createElement('div')
  container.setAttribute('role', 'banner')
  const portalContainer = document.createElement('div')
  shadowRoot.append(style, container, portalContainer)
  document.body.prepend(host)

  bar = {
    host,
    config,
    root: createRoot(container),
    jss: create({ ...jssPreset(), insertionPoint: style }),
    // Render MUI modals (dialogs, menus) in the shadow root instead of the
    // body. Enforcing focus is disabled because document.activeElement is the
    // shadow host, which the focus trap would see as outside of the modal.
    // Scroll lock is disabled because it expects the container parent to be
    // an element, not a shadow root.
    withShadowPortal: outerTheme => ({
      ...outerTheme,
      props: {
        ...outerTheme.props,
        MuiModal: {
          container: portalContainer,
          disableEnforceFocus: true,
          disableScrollLock: true
        }
      }
    })
  }
  setStatus(isClientReady ? 'ready' : config.public ? 'public' : 'waiting')
  if (idToken) return setCredentials({ idToken, cozyURL })
}

// Re-renders the mounted bar with other settings. Ignored before `mount`.
const updateConfig = changes => {
  if (!bar) return
  bar.config = { ...bar.config, ...changes }
  render()
}

/** @param {string} locale - Falls back to 'en' when the bar has no such locale */
export const setLocale = locale => updateConfig({ locale })

/** @param {'light'|'dark'} theme - Falls back to the device theme otherwise */
export const setTheme = theme => updateConfig({ theme })

/**
 * Exchanges the OIDC id token of the host app for a token of the Cozy, with
 * the token_exchange of cozy-stack. The token has the permissions of the
 * Cozy app linked to the id token audience.
 *
 * @param {string} cozyURL
 * @param {string} idToken
 */
const exchangeToken = async (cozyURL, idToken) => {
  const response = await fetch(new URL('/auth/token_exchange', cozyURL), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken, exchange_type: 'app' })
  })
  if (!response.ok) {
    throw new Error(`[cozy-bar] Token exchange failed: ${response.status}`)
  }
  const { access_token, refresh_token } = await response.json()
  // OAuthClient wraps the token in an AccessToken, which expects this shape
  return { access_token, refresh_token, token_type: 'bearer' }
}

/**
 * Exchanges the id token, then creates the Cozy client on first call, or only
 * updates its token on later calls, e.g. when the host app renews its id token.
 * A failed first exchange displays the bar logged out.
 *
 * @param {object} credentials
 * @param {string} credentials.idToken - OIDC id token of the user
 * @param {string} credentials.cozyURL - URL of the user's Cozy
 */
export async function setCredentials({ idToken, cozyURL }) {
  let token
  try {
    token = await exchangeToken(cozyURL, idToken)
  } catch (err) {
    if (!client) setStatus('public')
    throw err
  }

  if (client) {
    client.getStackClient().setToken(token)
    return
  }

  // An OAuth client is required to load the icons of the apps menu with the
  // token instead of cookies, which are not sent cross-origin
  const newClient = new CozyClient({ oauth: true, uri: cozyURL, token })
  newClient.registerPlugin(RealtimePlugin)
  injectFonts(cozyURL)
  // Assigned once set up, so that a failed setup can be retried
  client = newClient
  if (bar) render()

  // The host page has no [data-cozy] node to read flags from. They must be
  // loaded before rendering the apps, filtered with `apps.hidden`.
  try {
    await flag.initializeFromRemote(client)
  } catch (err) {
    logger.warn('Failed to load flags from remote', err)
  }
  isClientReady = true
  setStatus('ready')
}
