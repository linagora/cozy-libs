import React, { useEffect } from 'react'
import { render, fireEvent } from '@testing-library/react'
import { FileMentionProvider, useFileMention } from './FileMentionContext'
import FileChipsList from './FileChipsList'

jest.mock('cozy-ui/transpiled/react/Chips', () => {
  const MockChip = ({ label, onDelete, ...props }) => (
    <div data-testid="chip" {...props}>
      <span>{label}</span>
      {onDelete && (
        <button data-testid="chip-delete" onClick={onDelete}>
          delete
        </button>
      )}
    </div>
  )
  return { __esModule: true, default: MockChip }
})

// Helper to add files in test
const TestWrapper = ({ filesToAdd = [], children }) => {
  const { addFile } = useFileMention()
  useEffect(() => {
    filesToAdd.forEach(f => addFile(f))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return <>{children}</>
}

const renderWithFiles = (files = []) => {
  return render(
    <FileMentionProvider>
      <TestWrapper filesToAdd={files}>
        <FileChipsList />
      </TestWrapper>
    </FileMentionProvider>
  )
}

describe('FileChipsList', () => {
  it('should return null when no files selected', () => {
    const { container } = render(
      <FileMentionProvider>
        <FileChipsList />
      </FileMentionProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render chips for selected files', () => {
    const { getByText } = renderWithFiles([
      { id: '1', name: 'File1' },
      { id: '2', name: 'File2' }
    ])
    expect(getByText('File1')).toBeTruthy()
    expect(getByText('File2')).toBeTruthy()
  })

  it('should remove file when chip delete is clicked', () => {
    const { getByText, queryByText, getAllByTestId } = renderWithFiles([
      { id: '1', name: 'File1' },
      { id: '2', name: 'File2' }
    ])
    expect(getByText('File1')).toBeTruthy()

    const deleteButtons = getAllByTestId('chip-delete')
    fireEvent.click(deleteButtons[0])

    expect(queryByText('File1')).toBeNull()
    expect(getByText('File2')).toBeTruthy()
  })
})
