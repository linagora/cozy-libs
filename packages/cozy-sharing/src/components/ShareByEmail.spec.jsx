import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { act } from 'react-dom/test-utils'

import { ShareByEmail } from './ShareByEmail'
import AppLike from '../../test/AppLike'

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

  it('always shows the read/write dropdown trigger inside the input', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Editor' })).not.toBeNull()
  })
})
