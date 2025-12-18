import PropTypes from 'prop-types'
import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import AssistantIcon from 'cozy-ui/transpiled/react/Icons/Assistant'
import CrossMediumIcon from 'cozy-ui/transpiled/react/Icons/CrossMedium'
import Typography from 'cozy-ui/transpiled/react/Typography'

const PanelHeader = ({ onClose, t }) => {
  return (
    <div className="u-flex u-flex-items-center u-flex-justify-between u-h-3 u-ph-1 u-flex-shrink-0">
      <Typography variant="h4">
        <Icon icon={AssistantIcon} /> {t('Viewer.ai.panelTitle')}
      </Typography>
      <IconButton aria-label="Close AI Assistant" onClick={onClose}>
        <Icon icon={CrossMediumIcon} />
      </IconButton>
    </div>
  )
}

PanelHeader.propTypes = {
  onClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
}

export default PanelHeader
