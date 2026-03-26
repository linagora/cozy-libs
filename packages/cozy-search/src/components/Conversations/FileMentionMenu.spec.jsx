import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import FileMentionMenu from './FileMentionMenu'

const mockAddFile = jest.fn()
jest.mock('./FileMentionContext', () => ({
  ...jest.requireActual('./FileMentionContext'),
  useFileMention: () => ({
    selectedFiles: [],
    addFile: mockAddFile,
    removeFile: jest.fn(),
    getFileIDs: () => []
  })
}))

const mockUseFetchResult = jest.fn()
jest.mock('../Search/useFetchResult', () => ({
  useFetchResult: (...args) => mockUseFetchResult(...args)
}))

jest.mock('cozy-ui/transpiled/react/Paper', () => ({
  __esModule: true,
  default: ({ children, ...props }) => (
    <div data-testid="paper" {...props}>
      {children}
    </div>
  )
}))
jest.mock('cozy-ui/transpiled/react/List', () => ({
  __esModule: true,
  default: ({ children }) => <ul>{children}</ul>
}))
jest.mock('cozy-ui/transpiled/react/ListItem', () => ({
  __esModule: true,
  default: ({ children, onClick, selected, ...props }) => (
    <li onClick={onClick} data-selected={selected} {...props}>
      {children}
    </li>
  )
}))
jest.mock('cozy-ui/transpiled/react/ListItemIcon', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}))
jest.mock('cozy-ui/transpiled/react/ListItemText', () => ({
  __esModule: true,
  default: ({ primary, secondary }) => (
    <span>
      {primary}
      {secondary && ` - ${secondary}`}
    </span>
  )
}))
jest.mock('cozy-ui/transpiled/react/Icon', () => ({
  __esModule: true,
  default: () => <span data-testid="icon" />
}))
jest.mock('cozy-ui/transpiled/react/Spinner', () => ({
  __esModule: true,
  default: () => <span>Loading spinner</span>
}))

describe('FileMentionMenu', () => {
  const mockOnClose = jest.fn()
  const mockAnchorRef = { current: document.createElement('input') }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state', () => {
    mockUseFetchResult.mockReturnValue({ isLoading: true, results: null })
    const { getByText } = render(
      <FileMentionMenu
        anchorRef={mockAnchorRef}
        searchTerm="test"
        onClose={mockOnClose}
      />
    )
    expect(getByText('Loading...')).toBeTruthy()
  })

  it('should show "No files found" when empty results', () => {
    mockUseFetchResult.mockReturnValue({ isLoading: false, results: [] })
    const { getByText } = render(
      <FileMentionMenu
        anchorRef={mockAnchorRef}
        searchTerm="nonexistent"
        onClose={mockOnClose}
      />
    )
    expect(getByText('No files found')).toBeTruthy()
  })

  it('should render file results', () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: false,
      results: [
        {
          id: '1',
          primary: 'test.pdf',
          secondary: '/documents',
          icon: null,
          slug: 'drive'
        }
      ]
    })
    const { getByText } = render(
      <FileMentionMenu
        anchorRef={mockAnchorRef}
        searchTerm="test"
        onClose={mockOnClose}
      />
    )
    expect(getByText('test.pdf - /documents')).toBeTruthy()
  })

  it('should select file on click', () => {
    mockUseFetchResult.mockReturnValue({
      isLoading: false,
      results: [
        {
          id: '1',
          primary: 'test.pdf',
          secondary: '/documents',
          icon: null,
          slug: 'drive'
        }
      ]
    })
    const { getByText } = render(
      <FileMentionMenu
        anchorRef={mockAnchorRef}
        searchTerm="test"
        onClose={mockOnClose}
      />
    )
    fireEvent.click(getByText('test.pdf - /documents'))
    expect(mockAddFile).toHaveBeenCalledWith({
      id: '1',
      name: 'test.pdf',
      path: '/documents',
      icon: null
    })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle Escape key to close', () => {
    mockUseFetchResult.mockReturnValue({ isLoading: false, results: [] })
    render(
      <FileMentionMenu
        anchorRef={mockAnchorRef}
        searchTerm="test"
        onClose={mockOnClose}
      />
    )
    fireEvent.keyDown(mockAnchorRef.current, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })
})
