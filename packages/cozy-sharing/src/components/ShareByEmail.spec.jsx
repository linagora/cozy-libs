import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import React from 'react'
import { act } from 'react-dom/test-utils'

import flag from 'cozy-flags'

import { ShareByEmail } from './ShareByEmail'
import AppLike from '../../test/AppLike'

jest.mock('../helpers/contacts', () => ({
  // eslint-disable-next-line no-unused-vars
  getOrCreateFromArray: jest.fn((client, recipients, _createContact) => {
    // Return the recipients as-is by default (simulating contact creation/lookup)
    return Promise.resolve(recipients)
  })
}))

jest.mock('cozy-flags', () =>
  jest.fn(flagName => {
    if (flagName === 'drive.federated-shared-folder.enabled') {
      return false
    }
    return null
  })
)

describe('ShareByEmailComponent', () => {
  const defaultDocument = {
    id: 'doc_id',
    name: 'documentName'
  }

  const onShare = jest.fn()

  const setup = ({
    sharingDesc = 'test',
    document = defaultDocument,
    currentRecipients = [],
    sharedDrive = false
  } = {}) => {
    const props = {
      documentType: 'Files',
      onShare,
      document,
      sharingDesc,
      currentRecipients,
      createContact: jest.fn(),
      sharedDrive
    }
    return render(
      <AppLike>
        <ShareByEmail {...props} />
      </AppLike>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset flag mock to default (non-federated mode)
    flag.mockImplementation(flagName => {
      if (flagName === 'drive.federated-shared-folder.enabled') {
        return false
      }
      return null
    })
  })

  it('shoud call share if submited', async () => {
    const sharingDesc = 'test'

    setup({ sharingDesc })

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

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    })

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledWith({
        description: sharingDesc,
        document: defaultDocument,
        openSharing: true,
        readOnlyRecipients: [],
        recipients: [{ email: 'quentin@cozycloud.cc' }],
        sharedDrive: false
      })
    })
  })

  it('should alert user when it has reached the recipients limit for a document', async () => {
    flag.mockImplementation(flagName => {
      if (flagName === 'sharing.recipients-limit') {
        return 2
      }
      if (flagName === 'drive.federated-shared-folder.enabled') {
        return false
      }
      return null
    })

    setup({
      currentRecipients: [
        {
          email: 'alice@gmail.com',
          status: 'pending',
          type: 'two-way'
        },
        {
          email: 'bob@gmail.com',
          status: 'pending',
          type: 'two-way'
        }
      ]
    })

    act(() => {
      fireEvent.change(screen.getByPlaceholderText('Add contacts'), {
        target: { value: 'john@gmail.com' }
      })
    })

    act(() => {
      fireEvent.keyPress(screen.getByPlaceholderText('Add contacts'), {
        key: 'Enter',
        code: 'Enter',
        charCode: 13
      })
    })

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    })

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'I understand' }))
    })

    await waitFor(() => {
      expect(onShare).not.toHaveBeenCalled()
    })
  })
})
