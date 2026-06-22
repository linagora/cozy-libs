import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui/dist/cozy-ui.utils.min.css'
import 'cozy-ui-plus/dist/stylesheet.css'

import React from 'react'
import { createRoot } from 'react-dom/client'

import CozyClient, { CozyProvider } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { BarComponent } from './components/BarComponent'
import BarProvider from './components/BarProvider'

import './styles/index.styl'

export const mountBar = cfg => {
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
