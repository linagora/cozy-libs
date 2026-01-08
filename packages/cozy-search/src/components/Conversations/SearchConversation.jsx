import React, { useMemo } from 'react'

import { useQuery } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ImageIcon from 'cozy-ui/transpiled/react/Icons/Image'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'

import useConversation from '../../hooks/useConversation'
import { buildRecentConversationsQuery } from '../queries'
import styles from './styles.styl'

const SearchConversation = () => {
  const { createNewConversation, goToConversation } = useConversation()
  const convsQuery = buildRecentConversationsQuery()

  const handleCreateNewConversation = () => {
    createNewConversation()
  }

  const { data: conversations } = useQuery(
    convsQuery.definition,
    convsQuery.options
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

  const renderConversationItem = conv => {
    const lastMessage = conv.messages[conv.messages.length - 1]?.content || ''
    const date = new Date(conv.cozyMetadata?.updatedAt).toLocaleTimeString([], {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    return (
      <ListItem
        divider
        key={conv.id}
        button
        className={styles['search-conversation-item']}
        onClick={() => goToConversation(conv.id)}
      >
        <ListItemIcon>
          <Icon icon={ImageIcon} />
        </ListItemIcon>
        <ListItemText
          primary={
            <div className="u-flex u-flex-justify-between u-flex-items-center">
              <Typography variant="body1" className="u-text-ellipsis">
                {conv.id}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {date}
              </Typography>
            </div>
          }
          secondary={
            <Typography
              variant="body2"
              color="textSecondary"
              className="u-text-ellipsis"
            >
              Last message {lastMessage}
            </Typography>
          }
        />
      </ListItem>
    )
  }

  return (
    <div
      className={`u-w-100 u-flex u-flex-items-center u-flex-justify-center ${styles['search-conversation-container']}`}
    >
      <div className="u-maw-7 u-h-100">
        <SearchBar
          className="u-mb-2"
          placeholder="Rechercher dans vos conversations..."
          size="medium"
        />

        <Button
          label="New Chat"
          variant="secondary"
          startIcon={<Icon icon={PlusIcon} />}
          onClick={handleCreateNewConversation}
          size="large"
          className="u-mb-2"
        />

        <div className={styles['search-conversation-list']}>
          <Typography
            variant="subtitle1"
            color="textSecondary"
            className="u-mb-half"
          >
            Recent Conversations
          </Typography>
          <List>{groupedConversations.today?.map(renderConversationItem)}</List>

          {groupedConversations.older?.length > 0 && (
            <>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                className="u-mt-1 u-mb-half"
              >
                Yesterday
              </Typography>
              <List>
                {groupedConversations.older.map(renderConversationItem)}
              </List>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchConversation
