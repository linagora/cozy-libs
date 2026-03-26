import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import GlobalIcon from 'cozy-ui/transpiled/react/Icons/Global'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

const URLSourceItem = ({ source }) => {
  const { FileURL: url, Filename: title } = source

  if (!url) {
    return null
  }

  return (
    <ListItem
      className={styles.sourcesItem}
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      button
    >
      <ListItemIcon>
        <Icon icon={GlobalIcon} size={32} />
      </ListItemIcon>
      <ListItemText primary={title || url} secondary={url} />
    </ListItem>
  )
}

export default URLSourceItem
