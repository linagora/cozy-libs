import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import ButtonCozyHome from './ButtonCozyHome'
import { isFlagshipApp } from 'cozy-device-helper'
import { useWebviewIntent } from 'cozy-intent'
import { BarLike } from 'test/lib/BarLike'

jest.mock('cozy-device-helper')
jest.mock('cozy-intent', () => ({
  useWebviewIntent: jest.fn(() => ({ call: jest.fn() }))
}))

describe('ButtonCozyHome', () => {
  it('renders a link with backToHome intent for flagship apps', () => {
    isFlagshipApp.mockReturnValue(true)

    const mockCall = jest.fn()
    useWebviewIntent.mockImplementation(() => ({ call: mockCall }))

    // We need to use a testid because
    // - the a tag has no text to query it (just an icon)
    // - an "a" tag without href is not seen as a link by queryByRole
    const { getByTestId } = render(
      <BarLike>
        <ButtonCozyHome />
      </BarLike>
    )
    const linkElement = getByTestId('buttonCozyHome')

    fireEvent.click(linkElement)

    expect(mockCall).toHaveBeenCalledWith('backToHome')
  })

  it('renders a link with homeHref for non-flagship apps with homeHref', () => {
    isFlagshipApp.mockReturnValue(false)

    const { queryByRole } = render(
      <BarLike>
        <ButtonCozyHome homeHref="/home" />
      </BarLike>
    )
    const linkElement = queryByRole('link')

    expect(linkElement).toHaveAttribute('href', '/home')
  })

  it('renders a span without href for non-flagship apps without homeHref', () => {
    isFlagshipApp.mockReturnValue(false)

    const { queryByRole } = render(
      <BarLike>
        <ButtonCozyHome />
      </BarLike>
    )
    const linkElement = queryByRole('link')

    expect(linkElement).toBeNull()
  })
})
