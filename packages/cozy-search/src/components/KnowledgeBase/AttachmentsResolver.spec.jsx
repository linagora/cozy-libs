import { render } from '@testing-library/react'
import React from 'react'

import { useQuery, useQueryAll } from 'cozy-client'

import AttachmentsResolver from './AttachmentsResolver'
import { AssistantContext } from '../AssistantProvider'

// requireActual keeps Q and fetchPolicies real: buildFilesByDirIdQuery (used
// by the DirWatcher mocks below) builds genuine QueryDefinitions
jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useQuery: jest.fn(),
  useQueryAll: jest.fn(),
  RealTimeQueries: () => null
}))

const file = (id, attrs = {}) => ({ _id: id, type: 'file', name: id, ...attrs })
const dir = (id, attrs = {}) => ({ _id: id, type: 'directory', name: id, ...attrs })

const renderResolver = ({ selectedDocs, pickedResult, resultsByDirId }) => {
  useQuery.mockImplementation(() => pickedResult)
  useQueryAll.mockImplementation(definition => {
    // buildFilesByDirIdQuery definitions are functions; resolve the dirId
    // from the built selector
    const dirId = definition().selector.dir_id
    return (
      resultsByDirId[dirId] ?? { data: undefined, fetchStatus: 'loading' }
    )
  })

  const setAttachmentsResolution = jest.fn()
  const contextValue = { setAttachmentsResolution }
  const view = render(
    <AssistantContext.Provider value={contextValue}>
      <AttachmentsResolver conversationId="conv-1" selectedDocs={selectedDocs} />
    </AssistantContext.Provider>
  )
  return { setAttachmentsResolution, ...view }
}

describe('AttachmentsResolver', () => {
  beforeEach(() => jest.clearAllMocks())

  it('publishes the resolved file ids for a nested folder tree', () => {
    const root = dir('d1')
    const { setAttachmentsResolution } = renderResolver({
      selectedDocs: [root],
      pickedResult: { data: [root], fetchStatus: 'loaded' },
      resultsByDirId: {
        d1: { data: [file('f1'), dir('d2')], fetchStatus: 'loaded', hasMore: false },
        d2: { data: [file('f2')], fetchStatus: 'loaded', hasMore: false }
      }
    })

    expect(setAttachmentsResolution).toHaveBeenLastCalledWith('conv-1', {
      attachmentIds: ['f1', 'f2'],
      isOverLimit: false,
      isLoading: false,
      isUnavailable: false
    })
  })

  it('publishes a loading resolution while a directory is unresolved', () => {
    const root = dir('d1')
    const { setAttachmentsResolution } = renderResolver({
      selectedDocs: [root],
      pickedResult: { data: [root], fetchStatus: 'loaded' },
      resultsByDirId: {}
    })

    expect(setAttachmentsResolution).toHaveBeenLastCalledWith(
      'conv-1',
      expect.objectContaining({ isLoading: true })
    )
  })

  it('clears the resolution on unmount', () => {
    const picked = file('f1')
    const { setAttachmentsResolution, unmount } = renderResolver({
      selectedDocs: [picked],
      pickedResult: { data: [picked], fetchStatus: 'loaded' },
      resultsByDirId: {}
    })

    unmount()
    expect(setAttachmentsResolution).toHaveBeenLastCalledWith('conv-1', null)
  })
})
