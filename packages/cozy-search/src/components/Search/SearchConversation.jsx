import React, { useMemo, useState } from 'react'
import { useI18n } from 'twake-i18n'

import { useQuery } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { groupConversationsByDate } from './helpers'
import useConversation from '../../hooks/useConversation'
import ConversationList from '../Conversations/ConversationList'
import ConversationListItemWider from '../Conversations/ConversationListItemWider'
import { buildChatConversationsQuery } from '../queries'

const SearchConversation = () => {
  const { t } = useI18n()
  const { createNewConversation, goToConversation } = useConversation()

  const conversationsQuery = useMemo(() => buildChatConversationsQuery(), [])
  const { data: conversations } = useQuery(
    conversationsQuery.definition,
    conversationsQuery.options
  )

  const [query, setQuery] = useState('')

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    if (!query) return conversations

    const lowerQuery = query.toLowerCase()
    return conversations.filter(conversation =>
      conversation.messages?.some(msg =>
        msg.content?.toLowerCase().includes(lowerQuery)
      )
    )
  }, [conversations, query])

  const groupedConversations = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations]
  )

  return (
    <div className="u-w-100 u-h-100 u-flex u-flex-items-center u-flex-justify-center">
      <div className="u-maw-7 u-ph-half u-h-100 u-flex u-flex-column u-flex-items-start u-ov-hidden">
        <div className="u-w-100 u-mv-2">
          <SearchBar
            className="u-mb-2 u-w-100"
            placeholder={t('assistant.search_conversation.placeholder')}
            size="medium"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <Button
            label={t('assistant.search_conversation.new_chat')}
            variant="secondary"
            color="secondary"
            startIcon={<Icon icon={PlusIcon} />}
            onClick={createNewConversation}
            size="large"
            className="u-bdrs-6"
          />
        </div>

        <div className="u-ov-auto u-flex-auto">
          {groupedConversations.today?.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                className="u-mb-half"
              >
                {t('assistant.search_conversation.recent')}
              </Typography>
              <ConversationList
                divider={true}
                disableAction={true}
                conversations={groupedConversations.today}
                onOpenConversation={goToConversation}
                ItemComponent={ConversationListItemWider}
              />
            </>
          )}

          {groupedConversations.older?.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                className="u-mt-1 u-mb-half"
              >
                {t('assistant.search_conversation.older')}
              </Typography>
              <ConversationList
                divider={true}
                disableAction={true}
                conversations={groupedConversations.older}
                onOpenConversation={goToConversation}
                ItemComponent={ConversationListItemWider}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchConversation
