import { renderHook, act } from '@testing-library/react-hooks/dom'
import React from 'react'

import flag from 'cozy-flags'

import { useAttachmentsGate } from './useAttachmentsGate'
import AssistantProvider, { useAssistant } from '../AssistantProvider'

jest.mock('cozy-flags', () => jest.fn())

const wrapper = ({ children }) => (
  <AssistantProvider>{children}</AssistantProvider>
)

const file = (id, attrs = {}) => ({ _id: id, type: 'file', name: id, ...attrs })

describe('useAttachmentsGate', () => {
  beforeEach(() => {
    flag.mockImplementation(() => true)
  })

  it('blocks a selection with no resolution yet, for the default assistant', () => {
    const { result } = renderHook(
      () => ({
        assistant: useAssistant(),
        gate: useAttachmentsGate('conv-1')
      }),
      { wrapper }
    )

    act(() => {
      result.current.assistant.setAttachmentsSelection('conv-1', [file('f1')])
    })

    expect(result.current.gate.attachmentsBlocked).toBe(true)
    expect(result.current.gate.attachmentIds).toBeUndefined()
  })

  it('does not gate a custom (non-default) assistant: no deadlock', () => {
    const { result } = renderHook(
      () => ({
        assistant: useAssistant(),
        gate: useAttachmentsGate('conv-1')
      }),
      { wrapper }
    )

    act(() => {
      result.current.assistant.setAttachmentsSelection('conv-1', [file('f1')])
      result.current.assistant.setSelectedAssistantId('real-assistant-id')
    })

    expect(result.current.gate.attachmentsBlocked).toBe(false)
    expect(result.current.gate.attachmentIds).toBeUndefined()
  })

  it('does not gate when the feature flag is off', () => {
    flag.mockImplementation(() => false)
    const { result } = renderHook(
      () => ({
        assistant: useAssistant(),
        gate: useAttachmentsGate('conv-1')
      }),
      { wrapper }
    )

    act(() => {
      result.current.assistant.setAttachmentsSelection('conv-1', [file('f1')])
    })

    expect(result.current.gate.attachmentsBlocked).toBe(false)
    expect(result.current.gate.attachmentIds).toBeUndefined()
  })

  it('passes attachmentIds through for a clean, gated resolution', () => {
    const { result } = renderHook(
      () => ({
        assistant: useAssistant(),
        gate: useAttachmentsGate('conv-1')
      }),
      { wrapper }
    )

    act(() => {
      result.current.assistant.setAttachmentsSelection('conv-1', [file('f1')])
      result.current.assistant.setAttachmentsResolution('conv-1', {
        attachmentIds: ['f1'],
        isOverLimit: false,
        isLoading: false,
        isUnavailable: false,
        isEmpty: false
      })
    })

    expect(result.current.gate.attachmentsBlocked).toBe(false)
    expect(result.current.gate.attachmentIds).toEqual(['f1'])
  })
})
