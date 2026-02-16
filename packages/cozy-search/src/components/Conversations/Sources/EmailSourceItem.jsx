import React from 'react'

import { useClient, generateWebLink } from 'cozy-client'
import logger from 'cozy-logger'
import Icon from 'cozy-ui/transpiled/react/Icon'
import MailIcon from 'cozy-ui/transpiled/react/Icons/Mail'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

const EmailSourceItem = ({ email }) => {
  const client = useClient()

  if (!client) {
    logger.info('Client not available for EmailSourceItem')
    return null
  }

  const emailId = email.id.startsWith('tmail_') ? email.id.slice(6) : email.id

  const docUrl = generateWebLink({
    slug: 'mail',
    cozyUrl: client.getStackClient().uri,
    subDomainType: client.getInstanceOptions().subdomain,
    hash: `/bridge/dashboard/${emailId}`
  })

  const emailDate = email['datetime']
    ? new Date(email['datetime']).toISOString().slice(0, 10)
    : ''

  return (
    <ListItem
      className={styles['sourcesItem']}
      component="a"
      href={docUrl}
      target="_blank"
      rel="noopener noreferrer"
      button
    >
      <ListItemIcon>
        <Icon icon={MailIcon} size={32} />
      </ListItemIcon>
      <ListItemText
        primary={`${emailDate} - ${email['email.subject']}`}
        secondary={`${email['email.preview']}`}
      />
    </ListItem>
  )
}

export default EmailSourceItem
