import { Icon } from '@linagora/twake-icons'
import React from 'react'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

/**
 * Presentational file source. Both the link and the mime-type icon are
 * resolved by the backend adapter and handed over as props, so this
 * component stays backend-agnostic.
 */
const FileSourcesItem = ({ file, url, icon }) => (
  <ListItem
    className={styles['sourcesItem']}
    component="a"
    href={url}
    target="_blank"
    button
  >
    <ListItemIcon>
      <Icon icon={icon} size={32} />
    </ListItemIcon>
    <ListItemText
      primary={file.name}
      secondary={file.path?.replace(file.name, '')}
    />
  </ListItem>
)

export default FileSourcesItem
