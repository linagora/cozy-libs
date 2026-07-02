import 'cozy-ui/transpiled/react/stylesheet.css'
import 'cozy-ui/dist/cozy-ui.utils.min.css'
import 'cozy-ui-plus/dist/stylesheet.css'

import React from 'react'
import { createRoot } from 'react-dom/client'

import Polyglot from 'node-polyglot'

import CozyClient, { CozyProvider } from 'cozy-client'
import { RealtimePlugin } from 'cozy-realtime'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { I18n } from 'twake-i18n'

import enLocale from 'locales/en.json'

import { BarComponent } from './components/BarComponent'
import BarProvider from './components/BarProvider'

import './styles/index.styl'

export const mountBar = cfg => {
  // eslint-disable-next-line no-console
  console.log('[cozy-bar] mountBar called', cfg)

  const client = new CozyClient({ uri: cfg.cozyURL, token: cfg.accessToken })
  client.registerPlugin(RealtimePlugin)
  // eslint-disable-next-line no-console
  console.log('[cozy-bar] client created')

  document.body.style.setProperty('--zIndex-bar', '9999')

  const barHost = document.createElement('div')
  barHost.setAttribute('id', 'cozy-bar')
  barHost.setAttribute('role', 'banner')
  document.body.prepend(barHost)

  const root = document.createElement('div')
  document.body.appendChild(root)

  try {
    const rootInstance = createRoot(root)
    // eslint-disable-next-line no-console
    console.log('[cozy-bar] createRoot returned', rootInstance)

    rootInstance.render(
      <CozyProvider client={client}>
        <BreakpointsProvider>
          <BarProvider>
            <I18n lang="en" polyglot={new Polyglot({ locale: 'en', phrases: enLocale })}>
              <BarComponent
                appSlug={cfg.appSlug}
                appName={cfg.appName}
                iconPath={cfg.iconURL}
                searchOptions={{ enabled: false }}
              />
            </I18n>
          </BarProvider>
        </BreakpointsProvider>
      </CozyProvider>
    )
    // eslint-disable-next-line no-console
    console.log('[cozy-bar] render called')
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[cozy-bar] render error:', e)
  }
}
