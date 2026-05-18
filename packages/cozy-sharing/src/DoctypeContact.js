import { models } from 'cozy-client'
import { Contact as DoctypeContact } from 'cozy-doctypes'
const ContactModel = models.contact

export const getInitials = (contactOrRecipient, defaultValue = '') => {
  if (contactOrRecipient.public_name) {
    return contactOrRecipient.public_name[0].toUpperCase()
  }
  return ContactModel.getInitials(contactOrRecipient) || defaultValue
}

export const getDisplayName = (contactOrRecipient, defaultValue = '') => {
  if (contactOrRecipient.public_name) {
    return contactOrRecipient.public_name
  }
  return ContactModel.getDisplayName(contactOrRecipient) || defaultValue
}

export default DoctypeContact
