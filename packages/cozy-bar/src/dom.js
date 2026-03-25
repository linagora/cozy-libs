const APP_SELECTOR = '[role=application]'

// return an empty object by default to avoid checking existance
const getAppNodeDataSet = () => {
  const appNode = document.querySelector(APP_SELECTOR)
  if (!appNode || !appNode.dataset) return {}
  return appNode.dataset
}

const getCozyData = () => {
  const dataset = getAppNodeDataSet()
  if (!dataset.cozy) return { app: {} }
  return JSON.parse(dataset.cozy)
}

const getDefaultIcon = () => {
  const cozy = getCozyData()
  const dataset = getAppNodeDataSet()

  if (cozy.app.icon) {
    return cozy.app.icon
  } else if (dataset.cozyIconPath) {
    return dataset.cozyIconPath
  } else {
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  }
}

const getAppName = () => {
  const cozy = getCozyData()
  const dataset = getAppNodeDataSet()

  return cozy.app.name || dataset.cozyAppName || null
}

const getAppNamePrefix = () => {
  const cozy = getCozyData()
  const dataset = getAppNodeDataSet()

  return cozy.app.prefix || dataset.cozyAppNamePrefix || null
}

const getAppSlug = () => {
  const cozy = getCozyData()
  const dataset = getAppNodeDataSet()

  return cozy.app.slug || dataset.cozyAppSlug || null
}

const getUserActionRequired = () => {
  const meta = document.querySelector('meta[name=user-action-required]')
  const data = meta && meta.dataset
  if (data) {
    const { title, code, detail, links } = data
    if (code) {
      // we suppose that at least code will always exist
      return { title, code, detail, links }
    }
  }
  return undefined
}

export {
  getDefaultIcon,
  getAppName,
  getAppNamePrefix,
  getAppSlug,
  getUserActionRequired,
  APP_SELECTOR
}
