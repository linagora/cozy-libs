// Entry point of the standalone bar bundle, loaded with a script tag. See the
// "Standalone bar" section of the README for the `window.TwakeBar` API.
//
// `window.TwakeBar` is exposed synchronously. The bar module is evaluated only
// once the body exists, because cozy-ui prepends nodes to it when its theme
// modules are evaluated.
import { adoptHeadStyles, injectThemeVariables } from './styles'

// The bar module, once loaded. Calls made before are queued, in order.
let barModule = null
let loadError = null
const queue = []
let isLoading = false

// Runs a call of the bar module, its errors reject the returned promise
const run = (name, arg) => new Promise(resolve => resolve(barModule[name](arg)))

const load = async () => {
  try {
    injectThemeVariables()
    const headBefore = new Set(document.head.children)
    barModule = await import(/* webpackMode: 'eager' */ './mountBar')
    adoptHeadStyles(headBefore)
  } catch (err) {
    loadError = err
    for (const { reject } of queue.splice(0)) reject(err)
    return
  }
  for (const { name, arg, resolve } of queue.splice(0)) resolve(run(name, arg))
}

const ensureLoaded = () => {
  if (isLoading) return
  isLoading = true
  if (document.body) load()
  else document.addEventListener('DOMContentLoaded', load, { once: true })
}

const call = (name, arg) => {
  if (loadError) return Promise.reject(loadError)
  if (barModule) return run(name, arg)
  return new Promise((resolve, reject) => {
    queue.push({ name, arg, resolve, reject })
    ensureLoaded()
  })
}

window.TwakeBar = {
  mount: config => call('mountBar', config),
  unmount: () => call('unmountBar'),
  setCredentials: credentials => call('setCredentials', credentials),
  setLocale: locale => call('setLocale', locale),
  setTheme: theme => call('setTheme', theme)
}
