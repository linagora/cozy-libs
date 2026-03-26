import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { FileMentionProvider, useFileMention } from './FileMentionContext'

describe('FileMentionContext', () => {
  const TestComponent = () => {
    const { selectedFiles, addFile, removeFile, getFileIDs } = useFileMention()
    return (
      <div>
        <span data-testid="files">{JSON.stringify(selectedFiles)}</span>
        <span data-testid="ids">{JSON.stringify(getFileIDs())}</span>
        <button onClick={() => addFile({ id: '1', name: 'File1' })}>
          Add
        </button>
        <button onClick={() => removeFile('1')}>Remove</button>
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
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const BadComponent = () => {
      useFileMention()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow(
      'useFileMention must be used within FileMentionProvider'
    )
    spy.mockRestore()
  })
})
