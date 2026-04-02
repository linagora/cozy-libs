import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossCircleIcon from 'cozy-ui/transpiled/react/Icons/CrossCircle'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'

const RemoveButton = ({ onRemove }) => {
  return (
    <ListItemIcon className="u-ml-half">
      <IconButton aria-label="delete" size="medium" onClick={onRemove}>
        <Icon icon={CrossCircleIcon} />
      </IconButton>
    </ListItemIcon>
  )
}

export default RemoveButton
