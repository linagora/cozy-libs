import { Icon, Previous } from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import IconButton from 'cozy-ui/transpiled/react/IconButton'
import Input from 'cozy-ui/transpiled/react/Input'
import Paper from 'cozy-ui/transpiled/react/Paper'

const barStyle = {
  height: 48
}

const MobileHeader = ({ filter, placeholder, onChange, onDismiss }) => {
  return (
    <Paper
      square
      elevation={0}
      className="u-flex u-flex-items-center u-pr-3 u-pl-half"
      style={barStyle}
    >
      <IconButton className="u-mr-half" onClick={onDismiss} size="medium">
        <Icon icon={Previous} />
      </IconButton>
      <Input
        type="text"
        placeholder={placeholder}
        id={placeholder}
        value={filter}
        onChange={onChange}
        autoFocus
        fullWidth
        disableUnderline
      />
    </Paper>
  )
}

MobileHeader.propTypes = {
  filter: PropTypes.string,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  onDismiss: PropTypes.func
}

export default MobileHeader
