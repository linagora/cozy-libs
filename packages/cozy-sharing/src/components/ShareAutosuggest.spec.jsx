import { act, render, fireEvent, screen } from '@testing-library/react'
import React from 'react'

import ShareAutosuggest from './ShareAutosuggest'
import AppLike from '../../test/AppLike'

jest.mock('cozy-ui/transpiled/react/Spinner', () => ({
  Spinner: () => <div>loading</div>
}))

describe('ShareAutosuggest', () => {
  const setup = ({
    onPick,
    onRemove,
    loading = false,
    enableCreateContact = true,
    fetchContacts
  }) => {
    return render(
      <AppLike>
        <ShareAutosuggest
          loading={loading}
          contactsAndGroups={[]}
          placeholder="myPlaceHolder"
          onPick={onPick}
          recipients={[]}
          onRemove={onRemove}
          enableCreateContact={enableCreateContact}
          fetchContacts={fetchContacts}
        />
      </AppLike>
    )
  }

  it('tests if ShareAutosuggest calls onPick', () => {
    const onPick = jest.fn()
    const onRemove = jest.fn()

    setup({ onPick, onRemove })

    const inputNode = screen.getByPlaceholderText('myPlaceHolder')
    // It should not call onPick if the value is not an email
    fireEvent.change(inputNode, { target: { value: 'quentin@qq' } })
    fireEvent.keyPress(inputNode, { key: 'Enter', keyCode: 13, charCode: 13 })
    expect(onPick).not.toHaveBeenCalled()
    fireEvent.keyPress(inputNode, { key: 'Space', keyCode: 32, charCode: 32 })
    expect(onPick).not.toHaveBeenCalled()

    fireEvent.change(inputNode, { target: { value: 'quentin@cozycloud.cc' } })
    fireEvent.keyPress(inputNode, { key: 'Enter', keyCode: 13, charCode: 13 })
    expect(onPick).toHaveBeenCalledWith({ email: 'quentin@cozycloud.cc' })

    fireEvent.change(inputNode, {
      target: { value: 'quentin.valmori@cozycloud.cc' }
    })
    fireEvent.keyPress(inputNode, { key: 'Space', keyCode: 32, charCode: 32 })
    expect(onPick).toHaveBeenCalledWith({
      email: 'quentin.valmori@cozycloud.cc'
    })
  })

  it('should not call onPick for new contacts when enableCreateContact is false', () => {
    const onPick = jest.fn()
    const onRemove = jest.fn()

    setup({ onPick, onRemove, enableCreateContact: false })

    const inputNode = screen.getByPlaceholderText('myPlaceHolder')

    fireEvent.change(inputNode, { target: { value: 'new@cozycloud.cc' } })
    fireEvent.keyPress(inputNode, { key: 'Enter', keyCode: 13, charCode: 13 })
    expect(onPick).not.toHaveBeenCalled()
  })

  it('should show loading indicator when loading prop is true (autoFocus triggers onFocus on mount)', () => {
    const onPick = jest.fn()
    const onRemove = jest.fn()

    setup({ onPick, onRemove, loading: true })

    // autoFocus triggers onFocus on mount, which sets isLoadingDisplayed
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('should not show loading indicator when loading prop is false', () => {
    const onPick = jest.fn()
    const onRemove = jest.fn()

    setup({ onPick, onRemove, loading: false })

    expect(screen.queryByText('loading')).toBeNull()
  })

  describe('with fetchContacts', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      // Not implemented by jsdom, called when a suggestion is highlighted
      Element.prototype.scrollIntoView = jest.fn()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should suggest the fetched contacts, debounced and from 2 Unicode characters', async () => {
      const fetchContacts = jest.fn().mockResolvedValue([
        {
          _id: 'org-member-1',
          _type: 'io.cozy.contacts',
          displayName: 'Jean Dupont',
          email: [{ address: 'jean@org.example', primary: true }]
        }
      ])

      setup({ onPick: jest.fn(), onRemove: jest.fn(), fetchContacts })

      const inputNode = screen.getByPlaceholderText('myPlaceHolder')
      fireEvent.change(inputNode, { target: { value: '😀' } })
      act(() => jest.runAllTimers())
      expect(fetchContacts).not.toHaveBeenCalled()

      fireEvent.change(inputNode, { target: { value: 'dup' } })
      fireEvent.change(inputNode, { target: { value: 'du' } })
      act(() => jest.runAllTimers())
      expect(fetchContacts).toHaveBeenCalledTimes(1)
      expect(fetchContacts).toHaveBeenCalledWith('du')

      expect(await screen.findByText('Jean Dupont')).toBeInTheDocument()
    })

    it('should show the loading indicator until the contacts are fetched', async () => {
      let resolveFetch
      const fetchContacts = jest.fn(
        () => new Promise(resolve => (resolveFetch = resolve))
      )

      setup({ onPick: jest.fn(), onRemove: jest.fn(), fetchContacts })

      const inputNode = screen.getByPlaceholderText('myPlaceHolder')
      fireEvent.change(inputNode, { target: { value: 'dup' } })
      expect(screen.getByText('loading')).toBeInTheDocument()

      act(() => jest.runAllTimers())
      await act(async () => resolveFetch([]))
      expect(screen.queryByText('loading')).toBeNull()
    })

    it('ignores an older response, including when the same text is typed again', async () => {
      const requests = []
      const fetchContacts = jest.fn(
        () => new Promise(resolve => requests.push(resolve))
      )
      setup({ onPick: jest.fn(), onRemove: jest.fn(), fetchContacts })
      const input = screen.getByPlaceholderText('myPlaceHolder')
      for (const value of ['al', 'bo', 'al']) {
        fireEvent.change(input, { target: { value } })
        act(() => jest.runAllTimers())
      }
      const person = displayName => ({
        _type: 'io.cozy.contacts',
        displayName,
        email: [{ address: 'alice@example.org' }]
      })
      await act(async () => requests[2]([person('Latest Alice')]))
      await act(async () => requests[0]([person('Stale Alice')]))
      await act(async () => requests[1]([person('Bob')]))
      expect(screen.getByText('Latest Alice')).toBeInTheDocument()
      expect(screen.queryByText('Stale Alice')).toBeNull()
      expect(screen.queryByText('Bob')).toBeNull()
    })

    it('clears results immediately when the query becomes too short', async () => {
      const fetchContacts = jest
        .fn()
        .mockResolvedValue([
          { _type: 'io.cozy.contacts.groups', _id: 'team', name: 'Team' }
        ])
      setup({ onPick: jest.fn(), onRemove: jest.fn(), fetchContacts })
      const input = screen.getByPlaceholderText('myPlaceHolder')
      fireEvent.change(input, { target: { value: 'te' } })
      await act(async () => jest.runAllTimers())
      expect(screen.getByText('Team')).toBeInTheDocument()
      fireEvent.change(input, { target: { value: 't' } })
      expect(screen.queryByText('Team')).toBeNull()
    })

    it('keeps server order and picks a group without its members', async () => {
      const group = {
        _type: 'io.cozy.contacts.groups',
        _id: 'team',
        name: 'Team'
      }
      const onPick = jest.fn()
      setup({
        onPick,
        onRemove: jest.fn(),
        fetchContacts: jest.fn().mockResolvedValue([
          group,
          {
            _type: 'io.cozy.contacts',
            _id: 'bob',
            displayName: 'Bob',
            email: [{ address: 'bob@example.org' }]
          }
        ])
      })
      fireEvent.change(screen.getByPlaceholderText('myPlaceHolder'), {
        target: { value: 'te' }
      })
      await act(async () => jest.runAllTimers())
      expect(screen.getAllByRole('option')[0]).toHaveTextContent('Team')
      fireEvent.click(screen.getByText('Team'))
      expect(onPick).toHaveBeenCalledWith(group)
      expect(screen.getByPlaceholderText('myPlaceHolder')).toHaveValue('')
    })

    it('distinguishes a failed search from an empty result', async () => {
      setup({
        onPick: jest.fn(),
        onRemove: jest.fn(),
        fetchContacts: jest.fn().mockRejectedValue(new Error('Forbidden'))
      })
      fireEvent.change(screen.getByPlaceholderText('myPlaceHolder'), {
        target: { value: 'al' }
      })
      await act(async () => jest.runAllTimers())
      expect(screen.getByRole('alert')).toHaveTextContent('Loading error')
      expect(screen.queryByText('No suggestions')).toBeNull()
    })

    it('shows an empty result without an error', async () => {
      setup({
        onPick: jest.fn(),
        onRemove: jest.fn(),
        fetchContacts: jest.fn().mockResolvedValue([])
      })
      fireEvent.change(screen.getByPlaceholderText('myPlaceHolder'), {
        target: { value: 'al' }
      })
      await act(async () => jest.runAllTimers())
      expect(screen.getByRole('status')).toHaveTextContent('No suggestions')
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('does not render a response after unmounting', async () => {
      let resolveFetch
      const fetchContacts = jest.fn(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve
          })
      )
      const { unmount } = setup({
        onPick: jest.fn(),
        onRemove: jest.fn(),
        fetchContacts
      })
      fireEvent.change(screen.getByPlaceholderText('myPlaceHolder'), {
        target: { value: 'al' }
      })
      act(() => jest.runAllTimers())
      unmount()
      await act(async () => resolveFetch([]))
      expect(screen.queryByText('No suggestions')).toBeNull()
    })
  })
})
