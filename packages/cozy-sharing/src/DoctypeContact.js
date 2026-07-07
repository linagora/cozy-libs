import {
  getInitials as clientGetInitials,
  getDisplayName as clientGetDisplayName
} from 'cozy-client/dist/models/contact'
import { Contact as DoctypeContact } from 'cozy-doctypes'

const isContact = candidate => {
  return candidate._type === 'io.cozy.contacts'
}
export const getInitials = (contactOrRecipient, defaultValue = '') => {
  if (isContact(contactOrRecipient)) {
    return clientGetInitials(contactOrRecipient)
  } else {
    // @todo Extract to RecipientModel ?
    const s =
      contactOrRecipient.public_name ||
      contactOrRecipient.displayName ||
      contactOrRecipient.name ||
      contactOrRecipient.email

    if (!s) return defaultValue

    const parts = s.split(' ').filter(Boolean)
    if (parts.length === 0) return defaultValue
    const firstLetter = parts[0][0]
    const lastLetter = parts.length > 1 ? parts.at(-1)[0] : ''

    return (firstLetter + lastLetter).toUpperCase()
  }
}

export const getDisplayName = (contact, defaultValue = '') => {
  if (isContact(contact)) {
    return clientGetDisplayName(contact)
  } else {
    // @todo Extract to RecipientModel ?
    return (
      contact.public_name ||
      contact.displayName ||
      contact.name ||
      contact.email ||
      defaultValue
    )
  }
}

export default DoctypeContact
