import { render, screen } from '@testing-library/react'
import React from 'react'

import {
  ChatComponentsProvider,
  useChatComponents
} from './ChatComponentsContext'

const Probe = (): JSX.Element => {
  const { ComposerExtras } = useChatComponents()
  return <ComposerExtras />
}

it('returns injected components', () => {
  render(
    <ChatComponentsProvider
      components={{
        SourcesRenderer: () => null,
        ComposerExtras: () => <span>extras!</span>
      }}
    >
      <Probe />
    </ChatComponentsProvider>
  )
  expect(screen.getByText('extras!')).toBeTruthy()
})

it('falls back to no-op defaults without a provider', () => {
  const { container } = render(<Probe />)
  expect(container.innerHTML).toBe('')
})
