import cx from 'classnames'
import React from 'react'
import { useI18n } from 'twake-i18n'

import flag from 'cozy-flags'
import Icon from 'cozy-ui/transpiled/react/Icon'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import ConversationActions from './ConversationActions'
import styles from './styles.styl'
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

  return (
    <ListItem
      button
      onClick={() => onOpenConversation(conversation._id)}
      className={cx(
        'u-bdrs-4 u-ov-hidden u-mb-half',
        styles['conversation-list-item'],
        {
          [styles['conversation-list-item--selected']]: selected
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
              <Icon icon={AssistantIcon} className="u-mr-half" />
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
