import { Icon, Forbidden } from '@linagora/twake-icons'
import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { DEFAULT_DISPLAY_NAME } from '../../helpers/recipients'
import { getInitials, getDisplayName } from '../../models'

const GroupRecipientDetailWithoutAccess = ({ withoutAccess, isOwner }) => {
  const { t } = useI18n()

  return (
    <div>
      <Typography variant="subtitle2">
        {t('GroupRecipientDetail.withoutAccess.title')}
      </Typography>
      <List>
        {withoutAccess.map(recipient => {
          const icon = recipient.status === 'revoked' ? Forbidden : null
          const defaultDisplayName = t(DEFAULT_DISPLAY_NAME)
          const name = getDisplayName(recipient, defaultDisplayName)

          return (
            <ListItem
              disableGutters
              key={recipient.index}
              ellipsis={false}
              size="small"
            >
              <ListItemIcon>
                <Avatar size="m">{getInitials(recipient)}</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={name}
                secondary={
                  <div className="u-flex u-flex-items-center">
                    {icon ? (
                      <Icon
                        icon={icon}
                        size={10}
                        style={{
                          marginRight: '0.25rem'
                        }}
                      />
                    ) : null}
                    {t(
                      `GroupRecipientDetail.withoutAccess.status.${recipient.status}`
                    )}
                    {isOwner && recipient.status === 'mail-not-sent'
                      ? ` - ${t('GroupRecipientDetail.withoutAccess.addEmail')}`
                      : null}
                  </div>
                }
              />
            </ListItem>
          )
        })}
      </List>
    </div>
  )
}

export { GroupRecipientDetailWithoutAccess }
