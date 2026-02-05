import flag from 'cozy-flags'

export const getInstantMessage = assistantState =>
  Object.keys(assistantState.message)
    .sort((a, b) => a - b)
    .map(key => assistantState.message[key])
    .join('')

export const makeConversationId = () =>
  `${Date.now()}-${Math.floor(Math.random() * 90000) + 10000}`

export const pushMessagesIdInState = (id, res, setState) => {
  if (id !== res._id) return

  const messagesId = res.messages.map(message => message.id)
  setState(v => ({
    ...v,
    messagesId
  }))
}

export const isMessageForThisConversation = (res, messagesId) =>
  messagesId.includes(res._id)

export const isAssistantEnabled = () => flag('cozy.assistant.enabled')

/**
 * Sanitize chat content by removing special sources tags like
 * [REF]...[/REF] or [doc_X] that are not currently handled.
 *
 * @param {string} content - content to sanitize
 * @returns {string} sanitized content
 */
export const sanitizeChatContent = content => {
  if (!content) {
    return ''
  }
  return (
    content
      // Remove REFdoc_1/REF
      .replace(/\s?\[REF\][\s\S]*?\[\/REF\]/g, '')
      // Remove [REF]doc_1[/REF]
      .replace(/\s?REF[\s\S]*?\/REF/g, '')
      // remove « [doc_1] »
      .replace(/\s?\[doc_\d+\]/g, '')
  )
}

export const formatConversationDate = (dateString, t, lang) => {
  if (!dateString) return ''
  const date = new Date(dateString)

  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isToday || isYesterday) {
    const timeStr = date.toLocaleTimeString(lang, {
      hour: 'numeric',
      minute: '2-digit'
    })
    return `${
      isToday ? t('assistant.time.today') : t('assistant.time.yesterday')
    }, ${timeStr}`
  }

  return date.toLocaleDateString(lang, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  })
}

/**
 * Get name of the conversation
 * Since we don't have rule for conversation's name
 * So temporary we get the last question from user as name of the conversation
 */
export const getNameOfConversation = conversation => {
  return conversation.messages?.[conversation.messages?.length - 2]?.content
}

/**
 * Get description of the conversation
 * Since we don't have rule for description of the conversation
 * So temporary we get the last answer from assistant as description of the conversation
 */
export const getDescriptionOfConversation = conversation => {
  return conversation.messages?.[conversation.messages.length - 1]?.content
}
