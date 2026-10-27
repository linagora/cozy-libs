import PropTypes from 'prop-types'
import React from 'react'

import MemberRecipient from './MemberRecipient'

const OwnerRecipient = ({ owner }) => {
  if (!owner) return null

  return <MemberRecipient {...owner} />
}

OwnerRecipient.propTypes = {
  owner: PropTypes.object
}

export default OwnerRecipient
