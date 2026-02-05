/**
 * Groups conversations into 'today' and 'older' based on their updatedAt date.
 *
 * @param {Array} conversations - The list of conversations to group.
 * @returns {Object} An object with 'today' and 'older' arrays of conversations.
 */
export const groupConversationsByDate = conversations => {
  if (!conversations) return { today: [], older: [] }

  const groups = {
    today: [],
    older: []
  }

  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()

  conversations.forEach(conv => {
    const date = new Date(conv.cozyMetadata?.updatedAt || Date.now()).getTime()
    if (date >= today) {
      groups.today.push(conv)
    } else {
      groups.older.push(conv)
    }
  })

  return groups
}
