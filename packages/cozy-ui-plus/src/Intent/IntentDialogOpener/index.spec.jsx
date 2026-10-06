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
  default: ({ waitForReadyToUse, onResult }) => (
    <button
      type="button"
      data-testid="intent-iframe"
      data-wait-for-ready-to-use={waitForReadyToUse}
      onClick={() => onResult?.({ id: '1' })}
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

  it('gives the results of the intent and stays open', () => {
    const onResult = jest.fn()
    const { getByRole, getByTestId, queryByTestId } = render(
      <IntentDialogOpener
        action="OPEN"
        doctype="io.cozy.ai.chat.conversations"
        onResult={onResult}
      >
        <button type="button">Open</button>
      </IntentDialogOpener>
    )

    fireEvent.click(getByRole('button', { name: 'Open' }))
    fireEvent.click(getByTestId('intent-iframe'))

    expect(onResult).toHaveBeenCalledWith({ id: '1' })
    expect(queryByTestId('intent-iframe')).toBeInTheDocument()
  })
})
