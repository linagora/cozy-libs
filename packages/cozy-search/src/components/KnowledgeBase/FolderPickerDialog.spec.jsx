import { render, waitFor } from '@testing-library/react'
import React from 'react'

import FolderPickerDialog from './FolderPickerDialog'

const mockStart = jest.fn()
const mockCreate = jest.fn(() => ({ start: mockStart }))

jest.mock('cozy-interapp', () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)
jest.mock('cozy-client', () => ({ useClient: () => ({}) }))
jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: jest.fn() })
}))
jest.mock('cozy-ui/transpiled/react/Dialog', () => {
  const MockDialog = ({ children }) => <div>{children}</div>
  return {
    __esModule: true,
    default: MockDialog,
    DialogContent: ({ children }) => <div>{children}</div>
  }
})

describe('FolderPickerDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps the folder-only single-pick intent by default', async () => {
    mockStart.mockResolvedValue([{ id: 'dir-1', type: 'directory' }])
    const onSelect = jest.fn()

    render(
      <FolderPickerDialog open onClose={jest.fn()} onSelect={onSelect} />
    )

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    const [, , intentData] = mockCreate.mock.calls[0]
    expect(intentData.multiple).toBeUndefined()
    expect(intentData.reference).toEqual({
      label: 'assistant.knowledge_base.select_folder',
      allowFolder: true,
      onlyFolder: true
    })
    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith({ id: 'dir-1', type: 'directory' })
    )
  })

  it('supports multiple files+folders picking and returns an array', async () => {
    const docs = [
      { id: 'f1', type: 'file' },
      { id: 'dir-1', type: 'directory' }
    ]
    mockStart.mockResolvedValue(docs)
    const onSelect = jest.fn()

    render(
      <FolderPickerDialog
        open
        multiple
        onlyFolder={false}
        selectLabel="assistant.attachments.select"
        onClose={jest.fn()}
        onSelect={onSelect}
      />
    )

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    const [, , intentData] = mockCreate.mock.calls[0]
    expect(intentData.multiple).toBe(true)
    expect(intentData.reference).toEqual({
      label: 'assistant.attachments.select',
      allowFolder: true,
      onlyFolder: false
    })
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(docs))
  })
})
