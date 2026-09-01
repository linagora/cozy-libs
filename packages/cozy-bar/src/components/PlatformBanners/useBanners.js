import { useCallback, useEffect, useRef, useState } from 'react'

import { useClient } from 'cozy-client'
import {
  getActiveBanners,
  dismiss as dismissBanner
} from 'cozy-client/dist/models/banner'

const POLL_INTERVAL_MS = 5 * 60 * 1000

/**
 * The banners to display, kept up to date. cozy-client owns the reading rules;
 * this only owns when to read and how to record a dismissal.
 *
 * @returns {{banners: object[], dismiss: Function}} The banners and a dismisser
 */
export const useBanners = () => {
  const client = useClient()
  const [banners, setBanners] = useState([])
  const generation = useRef(0)

  const read = useCallback(async () => {
    if (!client) return
    const startedAt = generation.current
    try {
      const next = await getActiveBanners(client)
      if (generation.current === startedAt) setBanners(next)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[cozy-bar] could not read the platform banners', error)
    }
  }, [client])

  useEffect(() => {
    const readIfVisible = () => {
      if (document.visibilityState !== 'visible') return
      read()
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    read()
    const id = setInterval(readIfVisible, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', readIfVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', readIfVisible)
    }
  }, [read])

  const dismiss = useCallback(
    async banner => {
      // Hidden before the round trip; the bump stops an in-flight read
      // restoring it.
      generation.current += 1
      setBanners(current => current.filter(b => b.bannerId !== banner.bannerId))
      try {
        await dismissBanner(client, banner)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[cozy-bar] could not record the dismissal', error)
        read()
      }
    },
    [client, read]
  )

  return { banners, dismiss }
}
