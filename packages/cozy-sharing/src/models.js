import PropTypes from 'prop-types'

export const DOCTYPE_CONTACTS = 'io.cozy.contacts'
export const DOCTYPE_GROUPS = 'io.cozy.contacts.groups'

export const contactPropType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  _type: PropTypes.string.isRequired
})

export const groupPropType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  _type: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  trashed: PropTypes.bool
})

export { isContact, getInitials, getDisplayName } from './DoctypeContact'
