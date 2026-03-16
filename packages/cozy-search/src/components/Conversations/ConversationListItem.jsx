import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
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
        'u-bdrs-4 u-ov-hidden u-mb-half',
        styles['conversation-list-item'],
        {
          [styles[`conversation-list-item--selected--${theme}`]]: selected
        }
      )}
      selected={selected}
    >
      <ListItemText
        primary={
          <>
            <Typography variant="h6" className="u-ellipsis">
              {getNameOfConversation(conversation)}
            </Typography>
            {flag('cozy.conversation-actions.enabled') && (
              <ConversationActions
                buttonClassName={cx(styles['conversation-list-item-action'])}
              />
            )}
          </>
        }
        secondary={
          <>
            <Typography
              variant="h6"
              className="u-db u-ellipsis u-mb-half u-coolGrey"
            >
              {getDescriptionOfConversation(conversation)}
            </Typography>
            <Typography
              variant="h6"
              className="u-flex u-flex-items-center u-coolGrey"
            >
              <AssistantAvatar
                assistant={conversation.assistant}
                className="u-mr-half"
                isSmall
              />
              {formatConversationDate(
                conversation.cozyMetadata?.updatedAt,
                t,
                lang
              )}
            </Typography>
          </>
        }
      />
    </ListItem>
  )
}

export default ConversationListItem
