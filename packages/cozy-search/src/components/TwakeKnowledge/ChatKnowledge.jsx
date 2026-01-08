import React, { useState } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CommentIcon from 'cozy-ui/transpiled/react/Icons/Comment'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'

const ChatKnowledge = ({ selectedItems, onToggleItems, onClearItems }) => {
  const chats = [
    { id: 'chat1', name: 'Team Discussion' },
    { id: 'chat2', name: 'Project Updates' },
    { id: 'chat3', name: 'General Chat' },
    { id: 'chat4', name: 'Support' }
  ]

  const handleClearAll = () => {
    onClearItems(chats.map(c => c.id))
  }

  const selectedCount = chats.filter(c => selectedItems.includes(c.id)).length

  return (
    <>
      <div className={styles['chat-header-actions']}>
        {selectedCount > 0 && (
          <Button
            variant="text"
            size="small"
            label="Clear all"
            onClick={handleClearAll}
            className={styles['header-clear-all']}
          />
        )}
      </div>
      <List>
        {chats.map(chat => (
          <ListItem
            key={chat.id}
            button
            onClick={() => onToggleItems([chat.id])}
          >
            <ListItemIcon>
              <Checkbox
                checked={selectedItems.includes(chat.id)}
                onChange={() => onToggleItems([chat.id])}
              />
            </ListItemIcon>
            <ListItemIcon>
              <Icon icon={CommentIcon} color="var(--primaryColor)" />
            </ListItemIcon>
            <ListItemText primary={chat.name} />
          </ListItem>
        ))}
      </List>
    </>
  )
}

export default ChatKnowledge
