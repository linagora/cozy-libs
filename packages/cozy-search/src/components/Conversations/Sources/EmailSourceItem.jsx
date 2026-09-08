import { Icon, Mail } from '@linagora/twake-icons'
import React from 'react'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

/**
 * Presentational email source. The link is resolved by the backend adapter
 * and handed over as `url`, so this component stays backend-agnostic.
 */
const EmailSourceItem = ({ email, url }) => {
  if (!url) return null

  const emailDate = email['datetime']
    ? new Date(email['datetime']).toISOString().slice(0, 10)
    : ''

  const primary = [emailDate, email['email.subject']]
    .filter(Boolean)
    .join(' - ')

  return (
    <ListItem
      className={styles['sourcesItem']}
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      button
    >
      <ListItemIcon>
        <Icon icon={Mail} size={32} />
      </ListItemIcon>
      <ListItemText
        primary={primary || undefined}
        secondary={email['email.preview'] || undefined}
      />
    </ListItem>
  )
}

export default EmailSourceItem
