import { renderHook, act } from '@testing-library/react-hooks/dom'
import React from 'react'

import AssistantProvider, { useAssistant } from './AssistantProvider'

const wrapper = ({ children }) => (
  <AssistantProvider>{children}</AssistantProvider>
)

describe('AssistantProvider attachments state', () => {
  it('stores a selection per conversation and clears it with null', () => {
    const { result } = renderHook(() => useAssistant(), { wrapper })

    expect(result.current.attachmentsSelections).toEqual({})

    const docs = [{ _id: 'f1', type: 'file' }]
    act(() => {
      result.current.setAttachmentsSelection('conv-1', docs)
    })
    expect(result.current.attachmentsSelections).toEqual({ 'conv-1': docs })

    act(() => {
      result.current.setAttachmentsSelection('conv-1', null)
    })
    expect(result.current.attachmentsSelections).toEqual({})
  })

  it('stores a resolution per conversation and clears it with null', () => {
    const { result } = renderHook(() => useAssistant(), { wrapper })

    const resolution = {
      attachmentIds: ['f1'],
      isOverLimit: false,
      isLoading: false,
      isUnavailable: false
    }
    act(() => {
      result.current.setAttachmentsResolution('conv-1', resolution)
    })
    expect(result.current.attachmentsResolutions).toEqual({
      'conv-1': resolution
    })

    act(() => {
      result.current.setAttachmentsResolution('conv-1', null)
    })
    expect(result.current.attachmentsResolutions).toEqual({})
  })
})
