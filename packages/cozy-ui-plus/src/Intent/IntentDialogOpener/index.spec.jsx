import { fireEvent, render } from '@testing-library/react'
import React from 'react'

import IntentDialogOpener from './index'

jest.mock('cozy-ui/transpiled/react/CozyDialogs', () => ({
  DialogCloseButton: () => null
}))

jest.mock('cozy-ui/transpiled/react/Dialog', () => ({ children }) => (
  <div>{children}</div>
))

jest.mock('../IntentIframe', () => ({
  __esModule: true,
  default: ({ waitForReadyToUse }) => (
    <div
      data-testid="intent-iframe"
      data-wait-for-ready-to-use={waitForReadyToUse}
    />
  ),
  iframeProps: require('prop-types').shape({})
}))

describe('IntentDialogOpener', () => {
  it('forwards waitForReadyToUse to the intent iframe', () => {
    const { getByRole, getByTestId } = render(
      <IntentDialogOpener
        action="PICK"
        doctype="io.cozy.files"
        waitForReadyToUse
      >
        <button type="button">Open</button>
      </IntentDialogOpener>
    )

    fireEvent.click(getByRole('button', { name: 'Open' }))

    expect(getByTestId('intent-iframe')).toHaveAttribute(
      'data-wait-for-ready-to-use',
      'true'
    )
  })
})
