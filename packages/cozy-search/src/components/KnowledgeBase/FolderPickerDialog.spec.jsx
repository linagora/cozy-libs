import { render, waitFor } from '@testing-library/react'
import React from 'react'

import FolderPickerDialog from './FolderPickerDialog'

const mockStart = jest.fn()
const mockCreate = jest.fn(() => ({ start: mockStart }))
jest.mock('cozy-interapp', () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)

jest.mock('cozy-client', () => ({
  useClient: () => ({})
}))

const mockShowAlert = jest.fn()
jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: mockShowAlert })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

jest.mock('cozy-ui/transpiled/react/Dialog', () => {
  const MockDialog = ({ open, children }) =>
    open ? <div>{children}</div> : null
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

  const setup = ({ open = true, onClose = jest.fn(), onSelect = jest.fn() }) =>
    render(
      <FolderPickerDialog open={open} onClose={onClose} onSelect={onSelect} />
    )

  it('starts a PICK intent on io.cozy.files with the reference action', async () => {
    mockStart.mockReturnValue(new Promise(() => {}))
    setup({})

    await waitFor(() => expect(mockCreate).toHaveBeenCalled())
    expect(mockCreate).toHaveBeenCalledWith('PICK', 'io.cozy.files', {
      actions: [
        {
          label: 'assistant_create.from_drive.actions.add',
          action: 'reference',
          allowFolder: true
        }
      ]
    })
    expect(mockStart).toHaveBeenCalledWith(expect.any(HTMLElement))
  })

  it('calls onSelect with the picked folder then closes', async () => {
    const folder = {
      id: 'folder-1',
      name: 'HR',
      type: 'directory',
      doctype: 'io.cozy.files'
    }
    mockStart.mockResolvedValue([folder])
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onSelect).toHaveBeenCalledWith(folder)
  })

  it('closes without selecting when the intent is cancelled', async () => {
    mockStart.mockResolvedValue(null)
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows an alert and closes when the intent errors', async () => {
    mockStart.mockRejectedValue(new Error('boom'))
    const onClose = jest.fn()
    const onSelect = jest.fn()
    setup({ onClose, onSelect })

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(mockShowAlert).toHaveBeenCalledWith({
      message: 'assistant.knowledge_base.picker_error',
      severity: 'error'
    })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('does not start an intent when closed', () => {
    setup({ open: false })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('stops a pending intent on unmount without selecting or closing', async () => {
    const stop = jest.fn()
    const pending = new Promise(() => {})
    pending.stop = stop
    mockStart.mockReturnValue(pending)
    const onClose = jest.fn()
    const onSelect = jest.fn()
    const { unmount } = setup({ onClose, onSelect })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    unmount()

    expect(stop).toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('ignores a late resolution that arrives after unmount (React 18 StrictMode safety)', async () => {
    const folder = {
      id: 'folder-1',
      name: 'HR',
      type: 'directory',
      doctype: 'io.cozy.files'
    }
    let resolveStart
    const stop = jest.fn()
    const pending = new Promise(resolve => {
      resolveStart = resolve
    })
    pending.stop = stop
    mockStart.mockReturnValue(pending)
    const onClose = jest.fn()
    const onSelect = jest.fn()
    const { unmount } = setup({ onClose, onSelect })

    await waitFor(() => expect(mockStart).toHaveBeenCalled())
    unmount()

    resolveStart([folder])
    await pending

    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
