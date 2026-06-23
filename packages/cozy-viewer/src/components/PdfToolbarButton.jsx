import { Icon } from '@linagora/twake-icons'
import PropTypes from 'prop-types'
import React from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'

const PdfToolbarButton = ({ icon, onClick, disabled, label }) => (
  <Button
    variant="text"
    color="secondary"
    className="u-p-half u-m-half u-mah-2"
    icon={icon}
    onClick={onClick}
    disabled={disabled}
    label={<Icon icon={icon} size={16} />}
    aria-label={label}
    disableRipple
  />
)

PdfToolbarButton.propTypes = {
  icon: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired
}

export default PdfToolbarButton
