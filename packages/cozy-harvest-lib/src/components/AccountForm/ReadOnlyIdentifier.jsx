import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import Icon from 'cozy-ui/transpiled/react/Icon'
import BottomSelectIcon from 'cozy-ui/transpiled/react/Icons/BottomSelect'
import { Media, Img, Bd } from 'cozy-ui/transpiled/react/deprecated/Media'

import KonnectorIcon from '../KonnectorIcon'

const ReadOnlyIdentifier = props => {
  const { className, onClick, konnector, identifier, ...rest } = props

  return (
    <Box
      display="block"
      border={1}
      borderColor="var(--dividerColor)"
      borderRadius={8}
      padding={2}
      className={cx({ 'u-c-pointer': onClick }, className)}
      onClick={onClick}
      {...rest}
    >
      <Media>
        <Img>
          <KonnectorIcon konnector={konnector} className="u-w-1-half u-mr-1" />
        </Img>
        <Bd>{identifier}</Bd>
        <Img>
          <Icon icon={BottomSelectIcon} />
        </Img>
      </Media>
    </Box>
  )
}

ReadOnlyIdentifier.propTypes = {
  konnector: PropTypes.object.isRequired,
  identifier: PropTypes.string.isRequired
}

export default ReadOnlyIdentifier
