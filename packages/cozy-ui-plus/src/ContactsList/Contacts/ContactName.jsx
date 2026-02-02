import PropTypes from 'prop-types'
import React from 'react'

import { getDisplayName } from 'cozy-client/dist/models/contact'
import Typography from 'cozy-ui/transpiled/react/Typography'

const ContactName = ({ contact, disable }) => {
  const { familyName } = contact.name || {}
  const displayName = getDisplayName(contact)?.trim()
  const hasFamilyName = familyName && displayName?.endsWith(familyName)
  const namePrefix = hasFamilyName
    ? displayName.slice(0, -familyName.length).trimEnd()
    : null

  return (
    <Typography
      data-testid="ContactName" // used by a test in cozy-contacts
      className="u-ml-1"
      noWrap
      display="inline"
      color={disable ? 'textSecondary' : 'textPrimary'}
    >
      {hasFamilyName ? (
        <>
          {namePrefix && <>{namePrefix}&nbsp;</>}
          <span className="u-fw-bold">{familyName}</span>
        </>
      ) : (
        displayName
      )}
    </Typography>
  )
}

ContactName.propTypes = {
  contact: PropTypes.object.isRequired,
  disable: PropTypes.bool
}

export default ContactName
