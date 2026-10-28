import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { ShareByEmail } from './ShareByEmail'
import AppLike from '../../test/AppLike'
import SharingContext from '../context'

const mockMember = { _id: 'alice', email: [{ address: 'alice@example.org' }] }
const mockGroup = {
  _id: 'team',
  _type: 'io.cozy.contacts.groups',
  name: 'Team',
  members: [mockMember]
}

jest.mock('cozy-flags', () => ({ __esModule: true, default: () => false }))
jest.mock('./ShareAutosuggestWrapper', () => ({
  __esModule: true,
  default: ({ onPick }) => (
    <button onClick={() => onPick(mockGroup)}>Pick team</button>
  )
}))

it.each([true, false])(
  'shares groups as units only when suggestions are enabled (%s)',
  contactsSuggestEnabled => {
    const onChange = jest.fn()
    render(
      <AppLike>
        <SharingContext.Provider value={{ contactsSuggestEnabled }}>
          <ShareByEmail
            documentType="Files"
            pendingRecipients={[]}
            onPendingRecipientsChange={onChange}
            selectedOption="readWrite"
            onSelectedOptionChange={jest.fn()}
          />
        </SharingContext.Provider>
      </AppLike>
    )
    fireEvent.click(screen.getByText('Pick team'))
    expect(onChange).toHaveBeenCalledWith([
      contactsSuggestEnabled ? mockGroup : mockMember
    ])
  }
)
