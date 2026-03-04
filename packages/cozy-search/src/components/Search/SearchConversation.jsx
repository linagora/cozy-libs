import cx from 'classnames'
import debounce from 'lodash/debounce'
import escapeRegExp from 'lodash/escapeRegExp'
import React, { useEffect, useMemo, useState } from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Spinner from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import NotFoundConversation from './NotFoundConversation'
import { groupConversationsByDate } from './helpers'
import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'
import useFetchConversations from '../../hooks/useFetchConversations'
import { useAssistant } from '../AssistantProvider'
import ConversationList from '../Conversations/ConversationList'
import ConversationListItemWider from '../Conversations/ConversationListItemWider'

const SearchConversationContainer = ({ children, isMobile }) =>
  !isMobile ? (
    <div className="u-w-100 u-h-100 u-flex u-flex-items-center u-flex-justify-center">
      {children}
    </div>
  ) : (
    <Dialog fullScreen open className="u-w-100 u-h-100">
      {children}
    </Dialog>
  )

const SearchConversation = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const [query, setQuery] = useState(undefined)
  const [searchStr, setSearchStr] = useState('')

  const { createNewConversation, goToConversation } = useConversation()
  const { setIsOpenSearchConversation } = useAssistant()
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
    <SearchConversationContainer isMobile={isMobile}>
      <div
        className={cx(
          'u-h-100 u-flex u-flex-column u-flex-items-start u-ov-hidden',
          {
            'u-w-7 u-mh-half': !isMobile
          }
        )}
      >
        <div
          className={cx('u-w-100', {
            'u-mv-2': !isMobile
          })}
        >
          <div className="u-flex u-flex-items-center">
            <SearchBar
              elevation={isMobile ? 0 : 1}
              disabledHover={!!isMobile}
              disabledClear={!!isMobile}
              className={cx('u-w-100', styles['search-bar--mobile'], {
                'u-mb-2': !isMobile
              })}
              placeholder={t('assistant.search_conversation.placeholder')}
              size={isMobile ? 'small' : 'medium'}
              value={searchStr}
              onChange={handleSearchChange}
            />

            {isMobile && (
              <IconButton
                size="small"
                onClick={() => setIsOpenSearchConversation(false)}
                aria-label={t('assistant.search_conversation.close')}
              >
                <Icon icon={CrossIcon} />
              </IconButton>
            )}
          </div>

          {isMobile && <Divider className="u-mb-half" />}

          <Button
            label={t('assistant.search_conversation.new_chat')}
            variant="secondary"
            color="secondary"
            startIcon={<Icon icon={PlusIcon} />}
            onClick={createNewConversation}
            size="large"
            className="u-ml-half-t u-bdrs-6"
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
                    className="u-mb-half u-ml-half-t"
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
                    className="u-mt-1 u-mb-half u-ml-half-t"
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
    </SearchConversationContainer>
  )
}

export default SearchConversation
