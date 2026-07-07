import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import KnowledgeBaseSection from './KnowledgeBaseSection'

let mockPickerProps = null
jest.mock('./FolderPickerDialog', () => props => {
  mockPickerProps = props
  return props.open ? <div data-testid="folder-picker" /> : null
})

let mockFileQueryResult = { data: null, fetchStatus: 'loaded' }
jest.mock('cozy-client', () => ({
  useQuery: () => mockFileQueryResult,
  Q: jest.fn(() => ({ getById: jest.fn() })),
  // queries.js calls fetchPolicies.olderThan() at module load
  fetchPolicies: { olderThan: () => jest.fn() }
}))

jest.mock('cozy-flags', () => jest.fn(() => false))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

describe('KnowledgeBaseSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPickerProps = null
    mockFileQueryResult = { data: null, fetchStatus: 'loaded' }
  })

  it('shows the From drive button when no folder is selected', () => {
    render(<KnowledgeBaseSection knowledgeBase={[]} onChange={jest.fn()} />)

    expect(
      screen.getByText('assistant_create.steps.basic_info.from_drive')
    ).toBeTruthy()
  })

  it('opens the picker and propagates the picked folder', () => {
    const onChange = jest.fn()
    render(<KnowledgeBaseSection knowledgeBase={[]} onChange={onChange} />)

    fireEvent.click(
      screen.getByText('assistant_create.steps.basic_info.from_drive')
    )
    expect(screen.getByTestId('folder-picker')).toBeTruthy()

    mockPickerProps.onSelect({ id: 'folder-1', name: 'HR', type: 'directory' })

    expect(onChange).toHaveBeenCalledWith([
      { doctype: 'io.cozy.files', folderId: 'folder-1' }
    ])
  })

  it('shows the selected folder name and no From drive button', () => {
    mockFileQueryResult = {
      data: { _id: 'folder-1', name: 'HR' },
      fetchStatus: 'loaded'
    }
    render(
      <KnowledgeBaseSection
        knowledgeBase={[{ doctype: 'io.cozy.files', folderId: 'folder-1' }]}
        onChange={jest.fn()}
      />
    )

    expect(screen.getByText('HR')).toBeTruthy()
    expect(
      screen.queryByText('assistant_create.steps.basic_info.from_drive')
    ).toBeNull()
  })

  it('removes the folder', () => {
    mockFileQueryResult = {
      data: { _id: 'folder-1', name: 'HR' },
      fetchStatus: 'loaded'
    }
    const onChange = jest.fn()
    render(
      <KnowledgeBaseSection
        knowledgeBase={[{ doctype: 'io.cozy.files', folderId: 'folder-1' }]}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByLabelText('assistant.knowledge_base.remove'))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
