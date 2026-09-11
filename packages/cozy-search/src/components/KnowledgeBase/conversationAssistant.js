import { DEFAULT_ASSISTANT } from '../constants'

/**
 * Which assistant a loaded conversation selects. Undefined means "leave the
 * selection alone" (still loading).
 * @param {object} params
 * @param {string|undefined} params.boundId - The conversation's bound
 * assistant id (`conversation?.relationships?.assistant?.data?._id`).
 * @param {object|undefined} params.conversation - The conversation document,
 * or undefined when it does not exist (yet).
 * @param {boolean} params.isLoading - Whether the conversation query is
 * still loading.
 * @param {string|null} params.defaultId - The configured default assistant
 * id, only when its document is known to exist.
 * @returns {string|undefined}
 */
export const resolveConversationAssistantId = ({
  boundId,
  conversation,
  isLoading,
  defaultId
}) => {
  if (boundId) return boundId
  if (isLoading) return undefined
  if (!conversation) return defaultId || DEFAULT_ASSISTANT._id
  return DEFAULT_ASSISTANT._id
}
