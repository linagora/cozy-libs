import PropTypes from 'prop-types'
import React from 'react'

import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'

const QualificationListItemText = ({
  primary,
  secondary,
  disabled,
  ...props
}) => {
  return (
    <ListItemText
      {...props}
      disableTypography
      primary={
        primary ? <Typography variant="caption">{primary}</Typography> : null
      }
      secondary={
        <Typography
          component="div"
          variant="body1"
          style={disabled ? { color: 'var(--disabledTextColor)' } : undefined}
        >
          {secondary}
        </Typography>
      }
    />
  )
}

QualificationListItemText.propTypes = {
  primary: PropTypes.string,
  secondary: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  disabled: PropTypes.bool
}

export default QualificationListItemText
