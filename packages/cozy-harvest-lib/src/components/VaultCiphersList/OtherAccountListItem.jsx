import React from 'react'

import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import withLocales from '../hoc/withLocales'

const OtherAccountListItem = props => {
  const { f, t, ...rest } = props
  return (
    <ListItem button {...rest}>
      <ListItemText primary={t('vaultCiphersList.otherAccount')} />
    </ListItem>
  )
}

export default withLocales(OtherAccountListItem)
