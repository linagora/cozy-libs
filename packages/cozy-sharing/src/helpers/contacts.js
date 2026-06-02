import { validateEmail } from '../helpers/email'

// Return the contact object if present
// Else check if a contact exist with this email address, if yes return it
// if not create it
export const getOrCreateFromArray = async (client, contacts, createContact) => {
  return await Promise.all(
    contacts.map(async contact => {
      if (contact.id) {
        return contact
      } else if (validateEmail(contact.email)) {
        const matchedContact = await client.collection('io.cozy.contacts').find(
          {
            email: {
              $elemMatch: {
                address: contact.email
              }
            },
            _id: {
              $gt: null
            }
          },
          {
            indexedFields: ['_id']
          }
        )

        if (matchedContact.data.length > 0) {
          // We take the shortcut that if we have sevaral contacts
          // with the same address, we take the first one for now
          return matchedContact.data[0]
        } else {
          const resp = await createContact({
            email: [{ address: contact.email, primary: true }]
          })
          return resp.data
        }
      }
    })
  )
}

export const getContactsFromGroupId = (contacts = [], groupId) => {
  return contacts.filter(contact => {
    return contact.relationships?.groups?.data?.some(
      group => group._id === groupId
    )
  })
}

/**
 * Returns true when a contact does not exist. A contact without
 * an `_id` is always a placeholder that must be created before sharing.
 *
 * Used to decide whether the autosuggest input should allow creating
 * a new contact on the fly or should block the pick (depending on the
 * `enableCreateContact` flag).
 */
export const isContactToBeCreated = contact => {
  return !contact._id
}
