import React from 'react'

globalThis.__ALLOW_HTTP__ = false
globalThis.__SENTRY_TOKEN__ = 'token'
globalThis.__DEVELOPMENT__ = false

jest.mock('cozy-search', () => ({
  AssistantDesktop: () => <div>AssistantDesktop</div>,
  AssistantDialog: () => <div>AssistantDialog</div>
}))

jest.mock('cozy-ui-plus/dist/AppIcon', () => {
  return { __esModule: true, default: () => <div data-testid="AppIcon" /> }
})

jest.mock('cozy-ui-plus/dist/AppLinker', () => {
  return {
    __esModule: true,
    default: ({ children }) => children({ onClick: jest.fn(), href: '#' })
  }
})

jest.mock('cozy-ui-plus/dist/providers/CozyTheme', () => {
  return { __esModule: true, default: ({ children }) => <>{children}</> }
})
