import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router'

import { createMockClient } from 'cozy-client'

import { ShareModal } from './ShareModal'
import AppLike from '../../../test/AppLike'
import { SharingProvider } from '../../SharingProvider'
import { addSharingLink } from '../../state'
import { FederatedFolderModal } from '../FederatedFolder/FederatedFolderModal'

jest.mock('../ShareByEmail', () => () => null)

let mockFederated = false
jest.mock(
  'cozy-flags',
  () => flag =>
    flag === 'drive.federated-shared-folder.enabled' && mockFederated
)

const reportLabel = 'Send report with link statistics via email'

it.each([
  ['file', undefined, false, 'standard'],
  ['file', false, false, 'standard'],
  ['file', true, true, 'standard'],
  ['directory', true, true, 'standard'],
  ['file', true, true, 'routed'],
  ['file', true, false, 'routed-disabled'],
  ['directory', true, true, 'federated'],
  ['directory', undefined, false, 'direct'],
  ['directory', false, false, 'direct'],
  ['directory', true, true, 'direct']
])(
  'shows the report setting for %s with opt-in %s (%s)',
  (type, enabled, shown, mode) => {
    const document = { _id: 'file-1', id: 'file-1', name: 'Test', type }
    const permission = {
      id: 'permission-1',
      type: 'io.cozy.permissions',
      attributes: {
        permissions: {
          files: {
            type: 'io.cozy.files',
            verbs: ['GET'],
            values: [document.id]
          }
        },
        shortcodes: { code: 'code' }
      }
    }
    mockFederated = mode === 'federated'
    const client = createMockClient({})
    const collection = client.collection.bind(client)
    client.collection = doctype => {
      const result = collection(doctype)
      if (doctype === 'io.cozy.sharings') {
        result.fetchEffectiveRecipients = async () => ({ data: [] })
      }
      return result
    }
    client.options.uri = 'https://me.cozy.example'
    client.getStackClient().uri = 'https://me.cozy.example'
    const providerRef = React.createRef()
    render(
      <MemoryRouter
        initialEntries={[
          mode?.startsWith('routed')
            ? {
                pathname: '/',
                state: {
                  modalProps: {
                    document,
                    ...(mode === 'routed-disabled' && {
                      enableActivityReport: false
                    })
                  }
                }
              }
            : '/'
        ]}
      >
        <AppLike client={client}>
          <SharingProvider
            client={client}
            documentType="Files"
            ref={providerRef}
          >
            {mode === 'direct' ? (
              <FederatedFolderModal
                document={document}
                onClose={() => {}}
                enableActivityReport={enabled}
              />
            ) : (
              <ShareModal
                document={document}
                onClose={() => {}}
                enableActivityReport={enabled}
              />
            )}
          </SharingProvider>
        </AppLike>
      </MemoryRouter>
    )
    act(() => {
      providerRef.current.dispatch(addSharingLink([permission]))
      if (mode === 'federated')
        providerRef.current.setState({ allLoaded: true })
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Sharing link settings' })
    )
    const checkbox = screen.queryByRole('checkbox', { name: reportLabel })
    if (shown) {
      expect(checkbox).toBeDisabled()
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Remove access after a deadline' })
      )
      expect(checkbox).toBeEnabled()
    } else {
      expect(checkbox).toBeNull()
    }
  }
)
