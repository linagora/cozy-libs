import cx from 'classnames'
import React from 'react'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import ConversationActions from './ConversationActions'
import styles from './styles.styl'
import { getNameOfConversation } from '../helpers'

/**
 * A conversation of the sidebar: its name on one line, with its actions
 * on hover.
 */
const ConversationListItem = ({
  conversation,
  selected,
  onOpenConversation
}) => {
  return (
    <ListItem
      button
      onClick={() => onOpenConversation(conversation._id)}
      className={cx('u-ov-hidden u-ph-half', styles['conversation-list-item'], {
        [styles['conversation-list-item--selected']]: selected
      })}
      selected={selected}
    >
      <ConversationActions
        buttonClassName={styles['conversation-list-item-action']}
        conversation={conversation}
      />
      <ListItemText
        className="u-m-0"
        primaryTypographyProps={{
          component: 'div',
          className: styles['conversation-list-item-text']
        }}
        primary={
          <span
            className={cx(
              'u-ellipsis u-db',
              styles['conversation-list-item-title']
            )}
          >
            {getNameOfConversation(conversation)}
          </span>
        }
      />
    </ListItem>
  )
}

// Memoized so a re-render of the conversation list only re-renders items
// whose props actually changed (typically just the previously- and
// newly-selected items). This avoids rebuilding every item's ActionsMenu
// popover on each conversation switch.
export default React.memo(ConversationListItem)
