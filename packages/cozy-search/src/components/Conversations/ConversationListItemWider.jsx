import cx from 'classnames'
import React from 'react'
import { useI18n } from 'twake-i18n'

import flag from 'cozy-flags'
import Icon from 'cozy-ui/transpiled/react/Icon'
import ImageIcon from 'cozy-ui/transpiled/react/Icons/Image'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import ConversationActions from './ConversationActions'
import styles from './styles.styl'
import {
  formatConversationDate,
  getDescriptionOfConversation,
  getNameOfConversation
} from '../helpers'

const ConversationListItemWider = ({
  conversation,
  selected,
  divider,
  disableAction,
  onOpenConversation
}) => {
  const { t, lang } = useI18n()

  return (
    <ListItem
      divider={divider}
      button
      onClick={() => onOpenConversation(conversation._id)}
      className={cx(
        'u-bdrs-0 u-ov-hidden u-flex u-flex-items-center u-flex-justify-between u-w-100',
        styles['conversation-list-item']
      )}
      selected={selected}
    >
      <ListItemIcon>
        <Icon icon={ImageIcon} />
      </ListItemIcon>
      <ListItemText
        primary={
          <div className="u-flex u-flex-items-center">
            <Typography variant="h6" className="u-ellipsis u-mb-half">
              {getNameOfConversation(conversation)}
            </Typography>
            {!disableAction && flag('cozy.conversation-actions.enabled') && (
              <ConversationActions
                buttonClassName={cx(styles['conversation-list-item-action'])}
              />
            )}
          </div>
        }
        secondary={
          <Typography variant="h6" className="u-coolGrey">
            {getDescriptionOfConversation(conversation)}
          </Typography>
        }
      />
      <Typography className="u-miw-4 u-fz-xsmall u-ta-right">
        {formatConversationDate(conversation.cozyMetadata?.updatedAt, t, lang)}
      </Typography>
    </ListItem>
  )
}

export default ConversationListItemWider
