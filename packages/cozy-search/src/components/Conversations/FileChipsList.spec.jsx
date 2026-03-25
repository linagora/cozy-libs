import { render, fireEvent } from '@testing-library/react'
import React, { useEffect } from 'react'

import FileChipsList from './FileChipsList'
import { FileMentionProvider, useFileMention } from './FileMentionContext'

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
    const TestComponent = () => {
      const { addFile } = useFileMention()
      useEffect(() => {
        addFile({ id: '1', name: 'File1' })
        addFile({ id: '2', name: 'File2' })
      }, [])
      return <FileChipsList />
    }
    const { getByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    expect(getByText('File1')).toBeInTheDocument()
    expect(getByText('File2')).toBeInTheDocument()
  })

  it('should remove file on chip delete', () => {
    const TestComponent = () => {
      const { addFile } = useFileMention()
      useEffect(() => {
        addFile({ id: '1', name: 'File1' })
      }, [])
      return <FileChipsList />
    }
    const { getByText, queryByText } = render(
      <FileMentionProvider>
        <TestComponent />
      </FileMentionProvider>
    )
    const deleteButton = getByText('File1').closest('button')
    fireEvent.click(deleteButton)
    expect(queryByText('File1')).not.toBeInTheDocument()
  })
})
