import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import Typography from 'cozy-ui/transpiled/react/Typography'

import SharedDriveIcon from '../../assets/icons/shared-drive.svg'

const SharedDriveHeader = ({ title }) => {
  return (
    <div className="u-ta-center">
      <Icon icon={SharedDriveIcon} size={72} />
      <Typography className="u-mt-1" variant="h3">
        {title}
      </Typography>
    </div>
  )
}

export default SharedDriveHeader
