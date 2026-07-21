import flag from 'cozy-flags'

export const useCozySearchConversationEnabled = (): boolean =>
  !!flag('cozy.assistant.search-conversation.enabled')
