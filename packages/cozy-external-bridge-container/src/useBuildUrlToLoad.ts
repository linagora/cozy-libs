import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import Minilog from 'cozy-minilog'

import { BRIDGE_ROUTE_PREFIX } from './constants'

const log = Minilog('🌉 [Container bridge]')

interface UseBuildUrlToLoadReturnType {
  urlToLoad: string | undefined
}

// When we load the container app, we want to forward
// the relevant part of the URL to the iframe
export const useBuildUrlToLoad = (url: string): UseBuildUrlToLoadReturnType => {
  const location = useLocation()
  const [urlToLoad, setUrlToLoad] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (location.pathname.startsWith(BRIDGE_ROUTE_PREFIX)) {
      const destUrl = new URL(url)
      destUrl.pathname = location.pathname.replace(BRIDGE_ROUTE_PREFIX, '')
      destUrl.hash = location.hash
      destUrl.search = location.search

      log.debug('Setting iframe to', destUrl.toString(), 'after modification')
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrlToLoad(destUrl.toString())
    } else {
      log.debug('Setting iframe to', url)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrlToLoad(url)
    }
  }, [])

  return { urlToLoad }
}
