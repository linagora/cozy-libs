import cx from 'classnames'
import React, { useState, useRef } from 'react'
import { useI18n } from 'twake-i18n'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import DotsIcon from 'cozy-ui/transpiled/react/Icons/Dots'
import ImageIcon from 'cozy-ui/transpiled/react/Icons/Image'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import { remove } from '../../actions/delete'
import { rename } from '../../actions/rename'
import { share } from '../../actions/share'
import { formatConversationDate } from '../helpers'

const ConversationListItemWider = ({
  conversation,
  selected,
  divider,
  disableAction,
  onOpenConversation
}) => {
  const { t, lang } = useI18n()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const anchorRef = useRef(null)

  const toggleMenu = e => {
    e.preventDefault()
    setIsMenuOpen(!isMenuOpen)
  }

  const actions = makeActions([share, rename, remove], { t })

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
            <Typography className="u-ellipsis u-lh-xlarge u-mb-half">
              {conversation.messages[conversation.messages.length - 2]?.content}
            </Typography>
            {!disableAction && (
              <>
                <IconButton
                  className={cx(styles['conversation-list-item-action'])}
                  size="small"
                  ref={anchorRef}
                  onClick={toggleMenu}
                >
                  <Icon icon={DotsIcon} />
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
              </>
            )}
          </div>
        }
        secondary={
          conversation.messages[conversation.messages.length - 1]?.content
        }
      />
      <Typography variant="caption" className="u-miw-4 u-ta-right">
        {formatConversationDate(conversation.cozyMetadata.updatedAt, t, lang)}
      </Typography>
    </ListItem>
  )
}

export default ConversationListItemWider
