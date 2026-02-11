import cx from 'classnames'
import React, { useState, useRef } from 'react'
import { useI18n } from 'twake-i18n'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import { remove } from '../../actions/delete'
import { rename } from '../../actions/rename'
import { share } from '../../actions/share'
import { formatConversationDate } from '../helpers'

const ConversationListItem = ({
  conversation,
  selected,
  onOpenConversation
}) => {
  const { t, lang } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const anchorRef = useRef(null)

  const toggleMenu = e => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const actions = makeActions([share, rename, remove], { t })

  return (
    <ListItem
      button
      onClick={() => onOpenConversation(conversation._id)}
      className={cx(
        'u-bdrs-4 u-ov-hidden u-mb-half',
        styles['conversation-list-item']
      )}
      selected={selected}
    >
      <ListItemText
        primary={
          <div className="u-flex u-flex-items-center u-flex-justify-between">
            <Typography className="u-ellipsis u-lh-xlarge">
              {conversation.messages[conversation.messages.length - 2]?.content}
            </Typography>
            <IconButton
              className={cx(styles['conversation-list-item-action'])}
              size="small"
              ref={anchorRef}
              onClick={toggleMenu}
            >
              <Icon icon={DotsIcon} size={8} />
            </IconButton>
            <ActionsMenu
              ref={anchorRef}
              open={isMenuOpen}
              actions={actions}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              autoClose
              onClose={toggleMenu}
            />
          </div>
        }
        secondary={
          <>
            <Typography className="u-db u-ellipsis u-mb-half u-fz-xsmall">
              {conversation.messages[conversation.messages.length - 1]?.content}
            </Typography>
            <Typography className="u-flex u-flex-items-center u-fz-xsmall">
              <Icon icon={AssistantIcon} className="u-mr-half" />
              {formatConversationDate(
                conversation.cozyMetadata.updatedAt,
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
