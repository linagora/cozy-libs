import { useCallback, useMemo } from 'react'

import { useClient, useQuery, isQueryLoading } from 'cozy-client'

import { makeConversationId } from '../../components/helpers'
import {
  CHAT_CONVERSATIONS_DOCTYPE,
  buildChatConversationQueryById
} from '../../components/queries'
import useFetchConversations from '../../hooks/useFetchConversations'
import type { ConversationStore, StoredMessage } from '../ConversationStore'

// Hoisted to module scope so their identities are stable across renders (they
// capture nothing render-specific) and they don't need to appear in the store's
// useMemo deps — which would otherwise rebuild the store object every render.
const useConversations: ConversationStore['useConversations'] = () => {
  const { conversations, hasMore, isLoading, fetchMore } =
    useFetchConversations()
  return { conversations, hasMore, isLoading, fetchMore }
}

const useConversationMessages: ConversationStore['useConversationMessages'] = (
  conversationId: string
) => {
  const q = buildChatConversationQueryById(conversationId)
  const res = useQuery(q.definition, q.options) as {
    data?: { messages?: StoredMessage[] }
  }
  return {
    messages: res.data?.messages ?? [],
    isLoading: isQueryLoading(res)
  }
}

// `createConversation` / `deleteConversation` / `renameConversation` fulfil the
// ConversationStore contract for standalone consumers. The Cozy app itself
// still mints ids via useConversation and mutates via ConversationActions, so
// in-app these are reached mainly through the seam, not called directly here.
export const useCozyConversationStore = (): ConversationStore => {
  const client = useClient()

  const createConversation = useCallback(
    () => Promise.resolve(makeConversationId()),
    []
  )

  // Existing-doc mutations need the current `_rev`, so we fetch the document
  // first and spread it into destroy/save (as ConversationActions does in-app).
  const fetchConversation = useCallback(
    async (conversationId: string) => {
      const q = buildChatConversationQueryById(conversationId)
      const res = (await client?.query(q.definition)) as {
        data?: { _id: string; _rev?: string } | null
      }
      return res?.data ?? null
    },
    [client]
  )

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!client) return
      const conversation = await fetchConversation(conversationId)
      if (!conversation) return
      await client.destroy({
        ...conversation,
        _type: CHAT_CONVERSATIONS_DOCTYPE
      })
    },
    [client, fetchConversation]
  )

  const renameConversation = useCallback(
    async (conversationId: string, name: string) => {
      if (!client) return
      const conversation = await fetchConversation(conversationId)
      if (!conversation) return
      await client.save({
        ...conversation,
        _type: CHAT_CONVERSATIONS_DOCTYPE,
        name
      })
    },
    [client, fetchConversation]
  )

  return useMemo(
    () => ({
      useConversations,
      useConversationMessages,
      createConversation,
      deleteConversation,
      renameConversation
    }),
    [createConversation, deleteConversation, renameConversation]
  )
}
