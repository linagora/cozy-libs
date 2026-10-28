import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

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

jest.mock('cozy-flags', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('./ShareAutosuggestWrapper', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button onClick={() => onChange([mockGroup])}>Pick team</button>
  )
}))

it.each([
  [true, true],
  [true, false],
  [false, true],
  [false, false]
])(
  'uses the group flag (%s) independently of suggestions (%s)',
  (showRecipientGroups, contactsSuggestEnabled) => {
    flag.mockImplementation(
      name => name === 'sharing.show-recipient-groups' && showRecipientGroups
    )
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
      showRecipientGroups ? mockGroup : mockMember
    ])
  }
)
