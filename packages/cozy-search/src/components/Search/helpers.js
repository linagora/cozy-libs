const startOfDay = date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

export const formatDayLabel = (timestamp, lang) =>
  new Date(timestamp).toLocaleDateString(lang, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

/**
 * Groups conversations by calendar day based on their updatedAt date.
 * Returns an ordered array of buckets so today appears first, then yesterday,
 * then each earlier day descending.
 *
 * @param {Array} conversations - The list of conversations to group.
 * @returns {Array<{ key: string, dayTimestamp: number, items: Array }>}
 */
export const groupConversationsByDate = conversations => {
  if (!conversations || conversations.length === 0) return []

  const now = new Date()
  const todayTs = startOfDay(now)
  const yesterdayTs = todayTs - 86400000

  const buckets = new Map()
  conversations.forEach(conv => {
    const raw = conv.cozyMetadata?.updatedAt || Date.now()
    const dayTs = startOfDay(new Date(raw))
    if (!buckets.has(dayTs)) buckets.set(dayTs, [])
    buckets.get(dayTs).push(conv)
  })

  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayTimestamp, items]) => {
      let key
      if (dayTimestamp === todayTs) key = 'today'
      else if (dayTimestamp === yesterdayTs) key = 'yesterday'
      else key = 'date'
      return { key, dayTimestamp, items }
    })
}
