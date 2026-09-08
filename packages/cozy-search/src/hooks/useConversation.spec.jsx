import { renderHook, act } from '@testing-library/react-hooks/dom'

// Store mutable state for mocks
const mockNavigate = jest.fn()
let mockLocation = {
  pathname: '/',
  search: '',
  hash: ''
}

const mockSetIsOpenSearchConversation = jest.fn()

// Mock the modules
jest.mock('react-router-dom')
jest.mock('../contexts/ChatUIStateContext')
jest.mock('../components/helpers')

// Set up mock implementations
import * as routerModule from 'react-router-dom'
import * as chatUIStateModule from '../contexts/ChatUIStateContext'
import * as helpersModule from '../components/helpers'

routerModule.useNavigate.mockImplementation(() => mockNavigate)
routerModule.useLocation.mockImplementation(() => mockLocation)
chatUIStateModule.useChatUIState.mockImplementation(() => ({
  setIsOpenSearchConversation: mockSetIsOpenSearchConversation
}))
helpersModule.makeConversationId.mockImplementation(() => 'mock-id-123')

// Now import the hook after setting up mocks
import useConversation from './useConversation'

describe('useConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation = {
      pathname: '/',
      search: '',
      hash: ''
    }
    routerModule.useLocation.mockImplementation(() => mockLocation)
  })

  describe('goToConversation', () => {
    it('appends /assistant/id to a base url', () => {
      mockLocation.pathname = '/drive/folders/123'
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.goToConversation('convo-456')
      })

      expect(mockSetIsOpenSearchConversation).toHaveBeenCalledWith(false)
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/drive/folders/123/assistant/convo-456',
        search: '',
        hash: ''
      })
    })

    it('replaces existing /assistant/... path intelligently', () => {
      mockLocation.pathname = '/drive/folders/123/assistant/old-convo-789'
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.goToConversation('new-convo-000')
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/drive/folders/123/assistant/new-convo-000',
        search: '',
        hash: ''
      })
    })

    it('handles trailing slashes on base path correctly', () => {
      mockLocation.pathname = '/drive/folders/123/'
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.goToConversation('convo-456')
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/drive/folders/123/assistant/convo-456',
        search: '',
        hash: ''
      })
    })

    it('navigates correctly when assistant route is at the root', () => {
      mockLocation.pathname = '/assistant/old-convo-123'
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.goToConversation('new-convo-456')
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/assistant/new-convo-456',
        search: '',
        hash: ''
      })
    })

    it('preserves search query and hash fragments', () => {
      mockLocation = {
        pathname: '/base',
        search: '?foo=bar',
        hash: '#section1'
      }
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.goToConversation('convo-1')
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/base/assistant/convo-1',
        search: '?foo=bar',
        hash: '#section1'
      })
    })
  })

  describe('createNewConversation', () => {
    it('creates a new conversation using makeConversationId', () => {
      mockLocation.pathname = '/docs'
      routerModule.useLocation.mockImplementation(() => mockLocation)
      const { result } = renderHook(() => useConversation())

      act(() => {
        result.current.createNewConversation()
      })

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/docs/assistant/mock-id-123',
        search: '',
        hash: ''
      })
    })
  })
})
