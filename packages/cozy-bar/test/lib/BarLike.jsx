import React from 'react'

import I18n from 'twake-i18n'
import { CozyProvider, createMockClient } from 'cozy-client'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui/transpiled/react/providers/CozyTheme'

import enLocale from 'locales/en.json'

const TestI18n = ({ children }) => {
  return (
    <I18n dictRequire={() => enLocale} lang="en">
      {children}
    </I18n>
  )
}

const BarLike = ({ children, client }) => {
  const mockClient = createMockClient({
    clientOptions: {
      uri: 'http://cozy.localhost:8080'
    }
  })

  return (
    <CozyProvider client={client || mockClient}>
      <CozyTheme>
        <BreakpointsProvider>
          <TestI18n>{children}</TestI18n>
        </BreakpointsProvider>
      </CozyTheme>
    </CozyProvider>
  )
}

export { TestI18n, BarLike }
