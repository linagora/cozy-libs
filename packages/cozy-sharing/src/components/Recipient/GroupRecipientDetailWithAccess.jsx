import React from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { getInitials, getDisplayName } from '../../models'
import MemberRecipientStatus from './MemberRecipientStatus'

const GroupRecipientDetailWithAccess = ({ withAccess }) => {
  const { t } = useI18n()

  return (
    <div>
      <Typography variant="subtitle2">
        {t('GroupRecipientDetail.withAccess.title')}
      </Typography>
      <List>
        {withAccess.map(recipient => {
          const name = getDisplayName(recipient)

          return (
            <ListItem disableGutters key={recipient.index} size="small">
              <ListItemIcon>
                <Avatar size="m">{getInitials(recipient)}</Avatar>
              </ListItemIcon>
              <ListItemText
                primary={name}
                secondary={
                  <MemberRecipientStatus
                    status={recipient.status}
                    isMe={Boolean(recipient.isCurrentUser)}
                    instance={recipient.instance}
                    email={recipient.email}
                    name={recipient.name || recipient.public_name}
                  />
                }
              />
            </ListItem>
          )
        })}
      </List>
    </div>
  )
}

export { GroupRecipientDetailWithAccess }
