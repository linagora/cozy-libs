import cx from 'classnames'
import React from 'react'

import Divider from 'cozy-ui/transpiled/react/Divider'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import ConversationActions from './ConversationActions'
import styles from './styles.styl'
import AssistantAvatar from '../Assistant/AssistantAvatar'
import {
  formatConversationDate,
  getDescriptionOfConversation,
  getNameOfConversation
} from '../helpers'

const ConversationListItem = ({
  conversation,
  selected,
  onOpenConversation
}) => {
  const { t, lang } = useI18n()
  const { type: theme } = useCozyTheme()

  return (
    <ListItem
      button
      onClick={() => onOpenConversation(conversation._id)}
      className={cx(
        'u-ov-hidden u-flex-column',
        styles['conversation-list-item'],
        {
          [styles[`conversation-list-item--selected--${theme}`]]: selected
        }
      )}
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
        secondaryTypographyProps={{
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
        secondary={
          <>
            <span
              className={cx(
                'u-db u-ellipsis',
                styles['conversation-list-item-subtitle']
              )}
            >
              {getDescriptionOfConversation(conversation)}
            </span>
            <span
              className={cx(
                'u-flex u-flex-items-center',
                styles['conversation-list-item-subtitle'],
                styles['conversation-list-item-meta']
              )}
            >
              <AssistantAvatar assistant={conversation.assistant} isSmall />
              {formatConversationDate(
                conversation.cozyMetadata?.updatedAt,
                t,
                lang
              )}
            </span>
          </>
        }
      />
      <Divider className={styles['conversation-list-item-divider']} />
    </ListItem>
  )
}

// Memoized so a re-render of the conversation list only re-renders items
// whose props actually changed (typically just the previously- and
// newly-selected items). This avoids rebuilding every item's ActionsMenu
// popover on each conversation switch.
export default React.memo(ConversationListItem)
