import { render } from '@testing-library/react'
import { Popup } from 'components/Popup'
import React from 'react'

const props = {
  height: 500,
  width: 500,
  url: 'http://cozy.tools:8080'
}

const windowMock = {
  focus: jest.fn(),
  location: {},
  close: jest.fn(),
  closed: false
}

describe('Popup', () => {
  beforeEach(() => {
    // Reset windowMock functions between tests
    windowMock.focus = jest.fn()
    windowMock.close = jest.fn()
    windowMock.location = {}
    windowMock.closed = false

    jest.spyOn(global, 'open').mockImplementation(() => windowMock)

    // Use fake timers to avoid real setInterval
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  it('should open new window', () => {
    render(<Popup {...props} />)
    expect(global.open).toHaveBeenCalledWith(
      props.url,
      expect.anything(),
      expect.anything()
    )
    expect(windowMock.focus).toHaveBeenCalled()
  })
})
