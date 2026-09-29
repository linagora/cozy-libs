// Entry point of the standalone bar bundle, loaded with a script tag. See the
// "Standalone bar" section of the README for the `window.TwakeBar` API.
//
// `window.TwakeBar` is exposed synchronously. The bar module is evaluated only
// once the body exists, because cozy-ui prepends nodes to it when its theme
// modules are evaluated.
import { adoptHeadStyles, injectThemeVariables } from './styles'

// The bar module, once loaded. Calls made before are queued, in order.
let barModule = null
const queue = []
let isLoading = false

const load = async () => {
  try {
    injectThemeVariables()
    const headBefore = new Set(document.head.children)
    barModule = await import(/* webpackMode: 'eager' */ './mountBar')
    adoptHeadStyles(headBefore)
    for (const [name, arg] of queue.splice(0)) barModule[name](arg)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cozy-bar] Failed to load the bar', err)
  }
}

const ensureLoaded = () => {
  if (isLoading) return
  isLoading = true
  if (document.body) load()
  else document.addEventListener('DOMContentLoaded', load, { once: true })
}

const call = (name, arg) => {
  if (barModule) return barModule[name](arg)
  queue.push([name, arg])
  ensureLoaded()
}

window.TwakeBar = {
  mount: config => call('mountBar', config),
  setCredentials: credentials => call('setCredentials', credentials),
  setLocale: locale => call('setLocale', locale),
  setTheme: theme => call('setTheme', theme)
}
