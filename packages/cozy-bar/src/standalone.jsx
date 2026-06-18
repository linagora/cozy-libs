import React from 'react'
import { createRoot } from 'react-dom/client'

import CozyClient, { CozyProvider } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { BarComponent } from './components/BarComponent'
import BarProvider from './components/BarProvider'

const MOUNT_WARN =
  '[cozy-bar] window.twakeConfig.accessToken or cozyURL missing after 30s; bar not mounted'

let mounted = false
let intervalId = null
let attempts = 0

const tryMount = () => {
  if (mounted) return

  attempts += 1

  const cfg = window.twakeConfig
  if (!cfg || !cfg.accessToken || !cfg.cozyURL) {
    if (attempts >= 30) {
      if (intervalId) clearInterval(intervalId)
      // eslint-disable-next-line no-console
      console.warn(MOUNT_WARN)
    }
    return
  }

  mounted = true
  if (intervalId) clearInterval(intervalId)

  const client = new CozyClient({ uri: cfg.cozyURL, token: cfg.accessToken })

  const barHost = document.createElement('div')
  barHost.setAttribute('id', 'cozy-bar')
  barHost.setAttribute('role', 'banner')
  document.body.prepend(barHost)

  const root = document.createElement('div')
  document.body.appendChild(root)

  createRoot(root).render(
    <CozyProvider client={client}>
      <BreakpointsProvider>
        <BarProvider>
          <BarComponent
            appSlug={cfg.appSlug}
            appName={cfg.appName}
            iconPath={cfg.iconURL}
            searchOptions={{ enabled: false }}
          />
        </BarProvider>
      </BreakpointsProvider>
    </CozyProvider>
  )
}

tryMount()
if (!mounted) {
  intervalId = setInterval(tryMount, 1000)
}
