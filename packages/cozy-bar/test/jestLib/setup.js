/* eslint-disable react/display-name */
import '@babel/polyfill'
import React from 'react'

// polyfill for requestAnimationFrame
/* istanbul ignore next */
global.requestAnimationFrame = cb => {
  setTimeout(cb, 0)
}

process.env.USE_REACT = true

jest.mock('cozy-search', () => ({
  AssistantDesktop: () => <div>AssistantDesktop</div>,
  AssistantDialog: () => <div>AssistantDialog</div>
}))
