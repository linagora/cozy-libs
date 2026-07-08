import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import ActionCard from './ActionCard'

jest.mock('twake-i18n', () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key
  }),
  useExtendI18n: jest.fn()
}))

describe('ActionCard', () => {
  const args = { title: 'My note', content: '# Body' }

  it('shows title, params and the confirm button in proposed state', () => {
    const { container } = render(
      <ActionCard capabilityId="create_note" args={args} execute={jest.fn()} />
    )
    expect(
      screen.getByText('assistant.app_actions.create_note.title')
    ).toBeTruthy()
    expect(screen.getByText(/My note/)).toBeTruthy()
    expect(
      screen.getByText('assistant.app_actions.create_note.confirm')
    ).toBeTruthy()
    // app icon rendered in the header
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('uses the request language for card strings when lang is provided', () => {
    render(
      <ActionCard
        capabilityId="create_note"
        args={args}
        execute={jest.fn()}
        lang="en"
      />
    )
    // resolved from src/locales/en.json even though the app locale (mocked t)
    // would echo the key
    expect(screen.getByText('New note')).toBeTruthy()
    expect(screen.getByText('Create the note')).toBeTruthy()
  })

  it('falls back to the app locale for card strings without lang', () => {
    render(
      <ActionCard capabilityId="create_event" args={{}} execute={jest.fn()} />
    )
    expect(
      screen.getByText('assistant.app_actions.create_event.title')
    ).toBeTruthy()
  })

  it('executes on click and shows the done state with a link', async () => {
    const execute = jest.fn().mockResolvedValue({ url: 'https://notes/#/n/1' })
    render(
      <ActionCard capabilityId="create_note" args={args} execute={execute} />
    )

    fireEvent.click(
      screen.getByText('assistant.app_actions.create_note.confirm')
    )

    expect(execute).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByText('assistant.app_actions.create_note.done')
    ).toBeTruthy()
    const link = screen
      .getByText('assistant.app_actions.create_note.open')
      .closest('a')
    expect(link?.getAttribute('href')).toBe('https://notes/#/n/1')
  })

  it('shows the error state with retry on failure, retry re-executes', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new Error('403'))
      .mockResolvedValueOnce({ url: 'https://notes/#/n/1' })
    render(
      <ActionCard capabilityId="create_note" args={args} execute={execute} />
    )

    fireEvent.click(
      screen.getByText('assistant.app_actions.create_note.confirm')
    )
    expect(await screen.findByText('assistant.app_actions.error')).toBeTruthy()

    fireEvent.click(screen.getByText('assistant.app_actions.retry'))
    expect(
      await screen.findByText('assistant.app_actions.create_note.done')
    ).toBeTruthy()
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it('hides empty params and truncates long values', () => {
    render(
      <ActionCard
        capabilityId="create_event"
        args={{ title: 'x'.repeat(200), attendee: '' }}
        execute={jest.fn()}
      />
    )
    expect(
      screen.queryByText('assistant.app_actions.params.attendee')
    ).toBeNull()
    expect(screen.getByText(/x{10,}…/)).toBeTruthy()
  })
})
