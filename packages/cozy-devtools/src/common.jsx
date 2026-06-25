import { Icon, Right } from '@linagora/twake-icons'
import React from 'react'

import Grid from 'cozy-ui/transpiled/react/Grid'
import ListItemSecondaryAction from 'cozy-ui/transpiled/react/ListItemSecondaryAction'

/**
 * @type {Object.<string, React.CSSProperties>}
 * @private
 */
const styles = {
  listGridItem: {
    height: '100%',
    overflow: 'scroll',
    flexBasis: 240,
    flexShrink: 0,
    flexGrow: 0,
    boxShadow: 'var(--shadow1)'
  }
}

const NavSecondaryAction = () => {
  return (
    <ListItemSecondaryAction>
      <Icon
        icon={Right}
        className="u-mr-half"
        color="var(--secondaryTextColor)"
      />
    </ListItemSecondaryAction>
  )
}

const ListGridItem = ({ children }) => {
  return (
    <Grid item style={styles.listGridItem}>
      {children}
    </Grid>
  )
}

export { NavSecondaryAction, ListGridItem }
