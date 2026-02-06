import React, { useMemo } from 'react'
import { useI18n } from 'twake-i18n'

import { useQuery } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'

import useConversation from '../../hooks/useConversation'
import ConversationList from '../Conversations/ConversationList'
import ConversationListItemWider from '../Conversations/ConversationListItemWider'
import { buildChatConversationsQuery } from '../queries'

const SearchConversation = () => {
  const { t } = useI18n()
  const { createNewConversation, goToConversation } = useConversation()

  const conversationsQuery = buildChatConversationsQuery()
  const { data: conversations } = useQuery(
    conversationsQuery.definition,
    conversationsQuery.options
  )

  const groupedConversations = useMemo(() => {
    if (!conversations) return {}

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
      const date = new Date(
        conv.cozyMetadata?.updatedAt || Date.now()
      ).getTime()
      if (date >= today) {
        groups.today.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }, [conversations])

  return (
    <div className="u-w-100 u-flex u-flex-items-center u-flex-justify-center">
      <div className="u-maw-7 u-h-100">
        <SearchBar
          className="u-mb-2"
          placeholder={t('assistant.search_conversation.placeholder')}
          size="medium"
        />

        <Button
          label={t('assistant.search_conversation.new_chat')}
          variant="secondary"
          color="secondary"
          startIcon={<Icon icon={PlusIcon} />}
          onClick={createNewConversation}
          size="large"
          className="u-mb-2 u-bdrs-6"
        />

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
  )
}

export default SearchConversation
