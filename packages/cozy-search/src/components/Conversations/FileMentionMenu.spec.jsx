import { render, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

import { FileMentionProvider } from './FileMentionContext'
import FileMentionMenu from './FileMentionMenu'

const mockUseFetchResult = jest.fn()

jest.mock('../Search/useFetchResult', () => ({
  useFetchResult: searchTerm => mockUseFetchResult(searchTerm)
}))

describe('FileMentionMenu', () => {
  beforeEach(() => {
    mockUseFetchResult.mockReset()
  })

  it('should show loading state initially', () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: true,
      results: null
    })
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement('div')}
          searchTerm=""
        />
      </FileMentionProvider>
    )
    expect(getByText('Loading...')).toBeInTheDocument()
  })

  it('should show "No files found" when empty', async () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: false,
      results: []
    })
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement('div')}
          searchTerm="nonexistent"
        />
      </FileMentionProvider>
    )
    await waitFor(() => {
      expect(getByText('No files found')).toBeInTheDocument()
    })
  })

  it('should handle Tab key to select file', () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: false,
      results: [
        {
          id: '1',
          primary: 'test.pdf',
          secondary: '/documents',
          icon: { type: 'component', component: () => null },
          doc: { _type: 'io.cozy.files' }
        }
      ]
    })
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement('div')}
          searchTerm="test"
        />
      </FileMentionProvider>
    )
    const firstResult = getByText('test.pdf')
    fireEvent.keyDown(firstResult, { key: 'Tab' })
  })

  it('should handle Escape to close menu', () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: false,
      results: [
        {
          id: '1',
          primary: 'test.pdf',
          secondary: '/documents',
          icon: { type: 'component', component: () => null },
          doc: { _type: 'io.cozy.files' }
        }
      ]
    })
    const { getByText } = render(
      <FileMentionProvider>
        <FileMentionMenu
          anchorEl={document.createElement('div')}
          searchTerm="test"
        />
      </FileMentionProvider>
    )
    const firstResult = getByText('test.pdf')
    fireEvent.keyDown(firstResult, { key: 'Escape' })
  })
})
