import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { ChatUIStateProvider, useChatUIState } from './ChatUIStateContext'

const Probe = (): JSX.Element => {
  const { isOpenSearchConversation, setIsOpenSearchConversation } =
    useChatUIState()
  return (
    <button onClick={() => setIsOpenSearchConversation(v => !v)}>
      {isOpenSearchConversation ? 'open' : 'closed'}
    </button>
  )
}

it('shares the search panel state through the provider', () => {
  render(
    <ChatUIStateProvider>
      <Probe />
    </ChatUIStateProvider>
  )

  expect(screen.getByText('closed')).toBeTruthy()
  fireEvent.click(screen.getByText('closed'))
  expect(screen.getByText('open')).toBeTruthy()
})

it('throws when used without a provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow(/ChatUIStateProvider/)
  spy.mockRestore()
})
