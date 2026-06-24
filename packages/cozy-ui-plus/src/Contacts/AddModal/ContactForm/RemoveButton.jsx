import { Icon, CrossCircle } from '@linagora/twake-icons'
import React from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'

const RemoveButton = ({ onRemove }) => {
  return (
    <ListItemIcon className="u-ml-half">
      <IconButton aria-label="delete" size="medium" onClick={onRemove}>
        <Icon icon={CrossCircle} />
      </IconButton>
    </ListItemIcon>
  )
}

export default RemoveButton
