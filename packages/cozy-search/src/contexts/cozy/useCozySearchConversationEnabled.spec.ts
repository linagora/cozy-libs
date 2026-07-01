// The shared cozy-flags mock returns false for every flag, so the global test
// setup only ever exercises the OFF path. Override it here to cover the ON path.
jest.mock('cozy-flags', () => {
  const flag = (name: string): boolean =>
    name === 'cozy.assistant.search-conversation.enabled'
  // mirror the real default-export shape consumed via `import flag from ...`
  ;(flag as unknown as { default: unknown }).default = flag
  return flag
})

import { useCozySearchConversationEnabled } from './useCozySearchConversationEnabled'

describe('useCozySearchConversationEnabled', () => {
  it('returns true when the cozy flag is enabled', () => {
    expect(useCozySearchConversationEnabled()).toBe(true)
  })
})
