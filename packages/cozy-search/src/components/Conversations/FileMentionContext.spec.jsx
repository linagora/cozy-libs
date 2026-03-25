import { render, fireEvent } from '@testing-library/react'
import React from 'react'

import { FileMentionProvider, useFileMention } from './FileMentionContext'

describe('FileMentionContext', () => {
  const TestComponent = () => {
    const { selectedFiles, addFile, removeFile, getFileIDs } = useFileMention()
    const handleAdd = () => addFile({ id: '1', name: 'File1' })
    const handleRemove = () => removeFile('1')
    return (
      <div>
        <div data-testid="files">{JSON.stringify(selectedFiles)}</div>
        <div data-testid="ids">{JSON.stringify(getFileIDs())}</div>
        <button onClick={handleAdd}>Add</button>
        <button onClick={handleRemove}>Remove</button>
      </div>
    )
  }

  it('should start with empty file list', () => {
    const { getByTestId } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    expect(getByTestId('files').textContent).toBe('[]')
    expect(getByTestId('ids').textContent).toBe('[]')
  })

  it('should add files to the list', () => {
    const { getByTestId, getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    fireEvent.click(getByText('Add'))
    expect(getByTestId('files').textContent).toContain('File1')
    expect(getByTestId('ids').textContent).toContain('1')
  })

  it('should remove files from the list', () => {
    const { getByTestId, getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    fireEvent.click(getByText('Add'))
    fireEvent.click(getByText('Remove'))
    expect(getByTestId('files').textContent).toBe('[]')
  })

  it('should throw error when used outside provider', () => {
    const BadComponent = () => {
      useFileMention()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow(
      'useFileMention must be used within FileMentionProvider'
    )
  })
})
