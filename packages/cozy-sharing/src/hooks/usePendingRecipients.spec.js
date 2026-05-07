import { renderHook, act } from '@testing-library/react-hooks'

import { usePendingRecipients } from './usePendingRecipients'

describe('usePendingRecipients', () => {
  it('starts with empty recipients and readWrite option', () => {
    const { result } = renderHook(() => usePendingRecipients())
    expect(result.current.pendingRecipients).toEqual([])
    expect(result.current.selectedOption).toBe('readWrite')
  })

  it('reset() clears recipients and resets the option', () => {
    const { result } = renderHook(() => usePendingRecipients())
    act(() => {
      result.current.setPendingRecipients([{ email: 'a@b.c' }])
      result.current.setSelectedOption('readOnly')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.pendingRecipients).toEqual([])
    expect(result.current.selectedOption).toBe('readWrite')
  })
})
