import { useState, useEffect } from 'react'

import { useClient } from 'cozy-client'
import Minilog from 'cozy-minilog'

import { handleParentOriginRequest } from './helpers'

const log = Minilog('🌉 [Container bridge]')

interface UseListenParentOriginRequestReturnType {
  isReady: boolean
}

// Allow the iframe to request the origin of the parent window
export const useListenParentOriginRequest = (
  url: string
): UseListenParentOriginRequestReturnType => {
  const client = useClient()
  const [isReady, setIsReady] = useState<boolean>(false)

  useEffect(() => {
    if (!client) return

    const parentOriginRequestHandler = (event: MessageEvent): void =>
      handleParentOriginRequest(event, url)

    window.addEventListener('message', parentOriginRequestHandler)

    log.debug('Listening to parent origin request')

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsReady(true)

    return (): void => {
      window.removeEventListener('message', parentOriginRequestHandler)
    }
  }, [client, url])

  return { isReady }
}
