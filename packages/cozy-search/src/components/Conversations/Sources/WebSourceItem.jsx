import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import GlobeIcon from 'cozy-ui/transpiled/react/Icons/Globe'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

const WebSourceItem = ({ source }) => {
  const url = source.fileUrl
  const title = source.filename || url

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
        <Icon icon={GlobeIcon} size={32} />
      </ListItemIcon>
      <ListItemText primary={title} secondary={url} />
    </ListItem>
  )
}

export default WebSourceItem
