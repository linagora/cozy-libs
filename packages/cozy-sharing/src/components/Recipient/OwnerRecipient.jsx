import PropTypes from 'prop-types'
import React from 'react'

import MemberRecipient from './MemberRecipient'
import OwnerRecipientDefault from './OwnerRecipientDefault'

const OwnerRecipient = ({ recipients, isOrgSharedDrive }) => {
  const ownerRecipient = recipients.find(
    recipient => recipient.status === 'owner'
  )

  if (ownerRecipient) {
    return (
      <MemberRecipient
        {...ownerRecipient}
        isOrgSharedDrive={isOrgSharedDrive}
      />
    )
  }

  return <OwnerRecipientDefault />
}

OwnerRecipient.propTypes = {
  recipients: PropTypes.array.isRequired,
  isOrgSharedDrive: PropTypes.bool
}

export default OwnerRecipient
