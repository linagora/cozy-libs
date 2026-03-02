import debounce from 'lodash/debounce'
import escapeRegExp from 'lodash/escapeRegExp'
import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'

import NotFoundConversation from './NotFoundConversation'
import { groupConversationsByDate } from './helpers'
import useConversation from '../../hooks/useConversation'
import useFetchConversations from '../../hooks/useFetchConversations'
import ConversationList from '../Conversations/ConversationList'
import ConversationListItemWider from '../Conversations/ConversationListItemWider'

const SearchConversation = () => {
  const { t } = useI18n()
  const [query, setQuery] = useState(undefined)
  const [searchStr, setSearchStr] = useState('')

  const { createNewConversation, goToConversation } = useConversation()
  const { conversations, isLoading } = useFetchConversations({ query })

  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversations || []),
    [conversations]
  )

  const debouncedFetchConversations = useMemo(
    () =>
      debounce(async value => {
        // FIXME: This fallback query is highly inefficient.
        // It bypasses index usage, forcing CouchDB to scan the entire database,
        // deserialize every document, and then evaluate the regex via `$elemMatch`.
        // Furthermore, it restricts us from doing fuzzy-search.
        // We need a dedicated task to migrate this to an efficient client-side search approach.
        const fetchQuery = value
          ? {
              messages: {
                $elemMatch: {
                  content: {
                    $regex: escapeRegExp(value)
                  }
                }
              }
            }
          : undefined
        setQuery(fetchQuery)
      }, 300),
    [setQuery]
  )

  useEffect(() => {
    return () => {
      debouncedFetchConversations.cancel()
    }
  }, [debouncedFetchConversations])

  const handleSearchChange = e => {
    const newQuery = e.target.value
    setSearchStr(newQuery)
    debouncedFetchConversations(newQuery)
  }

  return (
    <div className="u-w-100 u-h-100 u-flex u-flex-items-center u-flex-justify-center">
      <div className="u-w-7 u-ph-half u-h-100 u-flex u-flex-column u-flex-items-start u-ov-hidden">
        <div className="u-w-100 u-mv-2">
          <SearchBar
            className="u-mb-2 u-w-100"
            placeholder={t('assistant.search_conversation.placeholder')}
            size="medium"
            value={searchStr}
            onChange={handleSearchChange}
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

        <div className="u-ov-auto u-flex-auto u-w-100 u-pos-relative">
          {isLoading ? (
            <div className="u-flex u-flex-items-center u-flex-justify-center u-p-2">
              <Spinner size="xxlarge" />
            </div>
          ) : searchStr ? (
            <ConversationList
              divider={true}
              disableAction={true}
              conversations={conversations}
              onOpenConversation={goToConversation}
              ItemComponent={ConversationListItemWider}
            />
          ) : (
            <>
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
            </>
          )}

          {!isLoading && conversations?.length === 0 && (
            <NotFoundConversation />
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchConversation
