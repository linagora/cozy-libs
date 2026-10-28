import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { createMockClient } from 'cozy-client'

import ShareAutosuggestWrapper from './ShareAutosuggestWrapper'
import AppLike from '../../test/AppLike'
import SharingContext from '../context'

jest.mock('cozy-flags', () => ({ __esModule: true, default: () => false }))

it('keeps typed text and local suggestions across connectivity changes', async () => {
  jest.useFakeTimers()
  const online = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  const suggest = jest.fn().mockResolvedValue({ data: [] })
  const client = createMockClient({
    queries: {
      'io.cozy.contacts/reachable': {
        doctype: 'io.cozy.contacts',
        data: [
          {
            _id: 'alice',
            _type: 'io.cozy.contacts',
            fullname: 'Alice Local',
            name: { givenName: 'Alice', familyName: 'Local' },
            email: [{ address: 'alice@example.org' }]
          }
        ]
      },
      'io.cozy.contacts.groups': {
        doctype: 'io.cozy.contacts.groups',
        data: []
      }
    }
  })
  jest.spyOn(client, 'collection').mockReturnValue({ suggest })
  const { unmount } = render(
    <AppLike client={client}>
      <SharingContext.Provider value={{ contactsSuggestEnabled: true }}>
        <ShareAutosuggestWrapper
          placeholder="Add contacts"
          onChange={jest.fn()}
        />
      </SharingContext.Provider>
    </AppLike>
  )

  try {
    const input = screen.getByPlaceholderText('Add contacts')
    fireEvent.change(input, { target: { value: 'A' } })
    await act(async () => {
      jest.advanceTimersByTime(350)
    })
    expect(suggest).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'Al' } })
    await act(async () => {
      jest.advanceTimersByTime(350)
    })
    expect(suggest).toHaveBeenCalledWith('Al')

    act(() => {
      online.mockReturnValue(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(input).toHaveValue('Al')
    expect(screen.getByText('Alice Local')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: 'Alice' } })
    await act(async () => {
      jest.advanceTimersByTime(350)
    })
    expect(suggest).toHaveBeenCalledTimes(1)

    act(() => {
      online.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(input).toHaveValue('Alice')
    await act(async () => {
      jest.advanceTimersByTime(350)
    })
    expect(suggest).toHaveBeenLastCalledWith('Alice')
  } finally {
    unmount()
    online.mockRestore()
    jest.useRealTimers()
  }
})
