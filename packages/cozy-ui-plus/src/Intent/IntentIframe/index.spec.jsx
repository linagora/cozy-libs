import { act, render, waitFor } from '@testing-library/react'
import React from 'react'

import IntentIframe from './index'

jest.mock('cozy-ui/transpiled/react/providers/CozyTheme', () => ({
  __esModule: true,
  default: ({ children, className, ignoreItself, type }) => (
    <div
      data-testid="intent-theme"
      data-theme={type}
      data-ignore-itself={ignoreItself}
      className={className}
    >
      {children}
    </div>
  )
}))

jest.mock('cozy-ui/transpiled/react/Spinner', () => () => (
  <div data-testid="intent-spinner" />
))

function setup({ data, startError = null, waitForReadyToUse = false } = {}) {
  let startOptions
  const start = jest.fn((element, options) => {
    startOptions = options
    element.appendChild(document.createElement('iframe'))
    return startError ? Promise.reject(startError) : new Promise(() => {})
  })
  const create = jest.fn(() => ({ start }))
  const onError = jest.fn()
  const onReadyToUse = jest.fn()
  const setIsLoading = jest.fn()

  const result = render(
    <IntentIframe
      action="PICK"
      client={{}}
      create={create}
      data={data}
      iframeProps={{ setIsLoading }}
      onCancel={jest.fn()}
      onError={onError}
      onReadyToUse={onReadyToUse}
      onTerminate={jest.fn()}
      type="io.cozy.files"
      waitForReadyToUse={waitForReadyToUse}
    />
  )

  return {
    ...result,
    getStartOptions: () => startOptions,
    onError,
    onReadyToUse,
    setIsLoading
  }
}

describe('IntentIframe', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each(['light', 'dark'])(
    'forces the %s theme on the iframe surface',
    theme => {
      const { getByTestId } = setup({ data: { theme: { type: theme } } })

      const intentTheme = getByTestId('intent-theme')

      expect(intentTheme).toHaveAttribute('data-theme', theme)
      expect(intentTheme).toHaveAttribute('data-ignore-itself', 'false')
      expect(intentTheme.className).not.toBe('')
    }
  )

  it.each([undefined, 'auto', 'sepia'])(
    'preserves the caller theme for %s',
    theme => {
      const data = theme === undefined ? undefined : { theme: { type: theme } }
      const { getByTestId } = setup({ data })
      const intentTheme = getByTestId('intent-theme')

      expect(intentTheme).not.toHaveAttribute('data-theme')
      expect(intentTheme.className).not.toBe('')
    }
  )

  it('keeps the iframe rendered behind the spinner until it is ready to use', () => {
    const {
      container,
      getStartOptions,
      onReadyToUse,
      queryByTestId,
      setIsLoading
    } = setup({ waitForReadyToUse: true })

    act(() => getStartOptions().onReady())

    expect(queryByTestId('intent-spinner')).toBeInTheDocument()
    expect(container.querySelector('iframe')).toBeInTheDocument()
    expect(
      container.querySelector(
        '[data-iframe-loaded="true"][data-waiting-for-ready-to-use="true"]'
      )
    ).toBeInTheDocument()
    expect(setIsLoading).not.toHaveBeenCalled()

    act(() => getStartOptions().onReadyToUse())

    expect(queryByTestId('intent-spinner')).toBe(null)
    expect(onReadyToUse).toHaveBeenCalledTimes(1)
    expect(setIsLoading).toHaveBeenCalledWith(false)
  })

  it('waits for the iframe when readyToUse is received first', () => {
    const { getStartOptions, queryByTestId, setIsLoading } = setup({
      waitForReadyToUse: true
    })

    act(() => getStartOptions().onReadyToUse())

    expect(queryByTestId('intent-spinner')).toBeInTheDocument()
    expect(setIsLoading).not.toHaveBeenCalled()

    act(() => getStartOptions().onReady())

    expect(queryByTestId('intent-spinner')).toBe(null)
    expect(setIsLoading).toHaveBeenCalledWith(false)
  })

  it('hides the spinner when the iframe loads by default', () => {
    const { getStartOptions, queryByTestId, setIsLoading } = setup()

    act(() => getStartOptions().onReady())
    act(() => getStartOptions().onReadyToUse())

    expect(queryByTestId('intent-spinner')).toBe(null)
    expect(setIsLoading).toHaveBeenCalledTimes(1)
  })

  it('shows intent errors instead of waiting for readyToUse', async () => {
    const error = new Error('Intent failed')
    const { container, onError, queryByTestId, setIsLoading } = setup({
      startError: error,
      waitForReadyToUse: true
    })

    await waitFor(() => expect(queryByTestId('intent-spinner')).toBe(null))

    expect(container).toHaveTextContent('Intent failed')
    expect(onError).toHaveBeenCalledWith(error)
    expect(setIsLoading).toHaveBeenCalledWith(false)
  })
})
