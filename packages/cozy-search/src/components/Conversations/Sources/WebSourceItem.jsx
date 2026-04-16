import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import GlobeIcon from 'cozy-ui/transpiled/react/Icons/Globe'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

const isHttpUrl = url =>
  typeof url === 'string' && /^https?:\/\//i.test(url.trim())

const WebSourceItem = ({ source }) => {
  const { url, title } = source

  if (!isHttpUrl(url)) return null

  const displayTitle = title || url

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
        <Icon icon={GlobeIcon} size={32} color="var(--primaryColor)" />
      </ListItemIcon>
      <ListItemText primary={displayTitle} secondary={url} />
    </ListItem>
  )
}

export default WebSourceItem
