import { resolveConversationAssistantId } from './conversationAssistant'

describe('resolveConversationAssistantId', () => {
  it('selects the bound assistant, regardless of anything else', () => {
    expect(
      resolveConversationAssistantId({
        boundId: 'bound',
        conversation: { _id: 'c1' },
        isLoading: false,
        defaultId: 'docs'
      })
    ).toBe('bound')
  })

  it('leaves the selection alone while the conversation query is loading', () => {
    expect(
      resolveConversationAssistantId({
        boundId: undefined,
        conversation: undefined,
        isLoading: true,
        defaultId: 'docs'
      })
    ).toBeUndefined()
  })

  it('selects the default for a new conversation when one is configured', () => {
    expect(
      resolveConversationAssistantId({
        boundId: undefined,
        conversation: undefined,
        isLoading: false,
        defaultId: 'docs'
      })
    ).toBe('docs')
  })

  it('selects the sentinel for a new conversation without a configured default', () => {
    expect(
      resolveConversationAssistantId({
        boundId: undefined,
        conversation: undefined,
        isLoading: false,
        defaultId: null
      })
    ).toBe('default_ai_assistant')
  })

  it('selects the sentinel for an existing conversation without an assistant, even with a default configured', () => {
    expect(
      resolveConversationAssistantId({
        boundId: undefined,
        conversation: { _id: 'c1' },
        isLoading: false,
        defaultId: 'docs'
      })
    ).toBe('default_ai_assistant')
  })
})
