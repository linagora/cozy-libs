import isEqual from 'lodash/isEqual'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useClient } from 'cozy-client'
import Minilog from 'cozy-minilog'
import useRealtime from 'cozy-realtime/dist/useRealtime'

import { DEFAULT_ASSISTANT } from '../components/constants'
import {
  buildChatConversationsQuery,
  CHAT_CONVERSATIONS_DOCTYPE
} from '../components/queries'

const log = Minilog('[useFetchConversations]')

/**
 * We use `client.query` manually instead of the `useQuery` hook from cozy-client
 * because `useQuery` currently drops the `included` array from its output state.
 * Without `included`, we cannot easily map the `assistant` relationship to each conversation.
 *
 * For more details on the cozy-client issue, see:
 * https://github.com/linagora/cozy-client/issues/1083
 *
 * @typedef {Object} Assistant
 * @property {string} _id
 * @property {string} name
 * @property {string} [icon]
 *
 * @typedef {Object} ConversationWithAssistant
 * @property {string} _id
 * @property {Array} messages
 * @property {Assistant} assistant - The assistant object bolted on from the query's `included` relationships, or the DEFAULT_ASSISTANT fallback.
 *
 * @param {Object} [props={}]
 * @param {Object} [props.query={}] - Optional query filters to pass to `where()`
 *
 * @returns {{
 *   conversations: ConversationWithAssistant[],
 *   hasMore: boolean,
 *   bookmark: string|null,
 *   isLoading: boolean,
 *   fetchMore: function(): Promise<void>,
 *   fetchConversations: function(string|null, Object): Promise<void>
 * }}
 */
const useFetchConversations = ({ query = {} } = {}) => {
  const client = useClient()
  const [conversations, setConversations] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [bookmark, setBookmark] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const previousQueryRef = useRef()
  const latestRequestIdRef = useRef(0)

  const conversationsQuery = useMemo(() => buildChatConversationsQuery(), [])

  const fetchConversations = useCallback(
    async (bookmark = null, fetchQuery) => {
      const requestId = ++latestRequestIdRef.current
      setIsLoading(true)
      try {
        const response = await client.query(
          conversationsQuery.definition({
            bookmark,
            query: fetchQuery
          })
        )
        if (requestId !== latestRequestIdRef.current) return

        const combinedData =
          response.data?.map(conversation => ({
            ...conversation,
            assistant:
              response.included?.find(
                included =>
                  included._id ===
                  conversation.relationships?.assistant?.data?._id
              ) || DEFAULT_ASSISTANT
          })) || []

        setConversations(prev =>
          !bookmark ? combinedData : [...prev, ...combinedData]
        )
        setHasMore(response.next)
        setBookmark(response.bookmark)
      } catch (error) {
        log.error('Error fetching conversations:', error)
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [client, conversationsQuery]
  )

  useEffect(() => {
    if (!isEqual(previousQueryRef.current, query)) {
      setConversations([])
      setHasMore(false)
      setBookmark(null)
      previousQueryRef.current = query
      fetchConversations(null, query)
    }
  }, [query, fetchConversations])

  const refreshConversations = useCallback(() => {
    fetchConversations(null, previousQueryRef.current)
  }, [fetchConversations])

  useRealtime(
    client,
    {
      [CHAT_CONVERSATIONS_DOCTYPE]: {
        created: refreshConversations,
        updated: refreshConversations,
        deleted: refreshConversations
      }
    },
    [refreshConversations]
  )

  const fetchMore = useCallback(async () => {
    if (hasMore) {
      await fetchConversations(bookmark, previousQueryRef.current)
    }
  }, [hasMore, bookmark, fetchConversations])

  return {
    conversations,
    hasMore,
    bookmark,
    isLoading,
    fetchMore,
    fetchConversations
  }
}

export default useFetchConversations
