import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { act } from 'react-dom/test-utils'

import { ShareByEmail } from './ShareByEmail'
import AppLike from '../../test/AppLike'

jest.mock('cozy-flags', () =>
  jest.fn(flagName => {
    if (flagName === 'drive.federated-shared-folder.enabled') return false
    return null
  })
)

describe('ShareByEmail (controlled)', () => {
  const setup = (overrides = {}) => {
    const onPendingRecipientsChange = jest.fn()
    const onSelectedOptionChange = jest.fn()
    const props = {
      document: { id: 'doc_id', name: 'documentName' },
      documentType: 'Files',
      currentRecipients: [],
      pendingRecipients: [],
      onPendingRecipientsChange,
      selectedOption: 'readWrite',
      onSelectedOptionChange,
      ...overrides
    }
    const utils = render(
      <AppLike>
        <ShareByEmail {...props} />
      </AppLike>
    )
    return { ...utils, onPendingRecipientsChange, onSelectedOptionChange }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls onPendingRecipientsChange when an email is picked', () => {
    const { onPendingRecipientsChange } = setup()

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Add contacts'), {
        target: { value: 'quentin@cozycloud.cc' }
      })
    })
    act(() => {
      fireEvent.keyPress(screen.getByPlaceholderText('Add contacts'), {
        key: 'Enter',
        code: 'Enter',
        charCode: 13
      })
    })

    expect(onPendingRecipientsChange).toHaveBeenCalledWith([
      { email: 'quentin@cozycloud.cc' }
    ])
  })

  it('shows the read/write toggle only when there are pending chips', () => {
    const { rerender } = setup()
    // Sharetypeselect is a react-select (combobox), not a radiogroup.
    // When no pending recipients, the select is hidden.
    expect(screen.queryByText('Editor')).toBeNull()

    rerender(
      <AppLike>
        <ShareByEmail
          document={{}}
          documentType="Files"
          currentRecipients={[]}
          pendingRecipients={[{ email: 'a@b.c' }]}
          onPendingRecipientsChange={jest.fn()}
          selectedOption="readWrite"
          onSelectedOptionChange={jest.fn()}
        />
      </AppLike>
    )
    expect(screen.queryByText('Editor')).not.toBeNull()
  })
})
