import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'

/**
 * Displays the button that starts the confirmation of a recipient
 */
const RecipientConfirm = ({ label, onClick }) => {
  return (
    <Button
      style={{ position: 'initial' }} // fix z-index bug on iOS when under a BottomDrawer due to relative position
      variant="text"
      onClick={onClick}
      label={label}
    />
  )
}

RecipientConfirm.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
}

export default RecipientConfirm
