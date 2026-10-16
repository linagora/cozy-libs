import { models } from 'cozy-client'
import flag from 'cozy-flags'

import { validateEmail } from '../helpers/email'
import { DOCTYPE_CONTACTS, DOCTYPE_GROUPS } from '../models'

const ContactModel = models.contact

// Return the contact object if present
// Else check if a contact exist with this email address, if yes return it
// if not create it
// With sharing.contacts-suggest.enabled, people are sent by email and the
// stack finds or creates the contact: an org member's id is not on this instance
export const getOrCreateFromArray = async (client, contacts, createContact) => {
  if (flag('sharing.contacts-suggest.enabled')) {
    return contacts.map(contact => {
      if (contact._type === DOCTYPE_GROUPS) return contact
      const email = ContactModel.getPrimaryEmail(contact)
      if (validateEmail(email)) return { _type: DOCTYPE_CONTACTS, email }
      return contact._id ? contact : undefined
    })
  }

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

// A suggestion without id has no contact document, and only a fullname,
// which getDisplayName does not read
export const suggestContacts = async (client, q) => {
  const { data } = await client
    .getStackClient()
    .fetchJSON('GET', `/contacts/suggest?q=${encodeURIComponent(q)}`)
  return data.map(({ id, type, attributes }) => ({
    ...attributes,
    ...(id ? { _id: id, id } : { displayName: attributes.fullname }),
    _type: type
  }))
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

const isCurrentUser = contact => contact.me === true

/**
 * Computes the contacts and groups to suggest when adding recipients to a
 * sharing. The unreachable contacts only count in the members of the groups,
 * when flag sharing.show-recipient-groups is enabled.
 *
 * @param {object} params
 * @param {object[]} params.reachableContacts - Contacts that can be shared with
 * @param {object[]} params.unreachableContactsWithGroups - Contacts that cannot be shared with but belong to a group
 * @param {object[]} params.contactGroups - Groups of contacts
 * @param {object[]} params.currentRecipients - Recipients already in the sharing
 * @param {object[]} params.pendingRecipients - Recipients picked but not yet shared with
 * @returns {object[]} The contacts, then the groups with their members
 */
export const computeContactsAndGroups = ({
  reachableContacts,
  unreachableContactsWithGroups,
  contactGroups,
  currentRecipients,
  pendingRecipients
}) => {
  const suggestedContacts = reachableContacts.filter(
    contact =>
      !isCurrentUser(contact) &&
      // We do not want contact already in the sharing
      !currentRecipients.find(
        r => r.email === ContactModel.getPrimaryEmail(contact)
      ) &&
      // We do not want contact currently in pending contacts (in chips)
      !pendingRecipients.find(r => r._id === contact._id)
  )

  const unreachableContacts = unreachableContactsWithGroups.filter(
    contact => !isCurrentUser(contact)
  )
  const currentRecipientGroups = currentRecipients
    .map(({ id }) => id)
    .filter(Boolean)
  const suggestedGroups = contactGroups
    .filter(
      ({ _id }) =>
        !flag('sharing.show-recipient-groups') ||
        !currentRecipientGroups.includes(_id)
    )
    .map(contactGroup => {
      const reachableMembers = getContactsFromGroupId(
        suggestedContacts,
        contactGroup.id
      ).map(contact => ({
        ...contact,
        isReachable: true
      }))

      if (flag('sharing.show-recipient-groups') !== true) {
        return {
          ...contactGroup,
          members: reachableMembers
        }
      }

      const unreachableMembers = getContactsFromGroupId(
        unreachableContacts,
        contactGroup.id
      ).map(contact => ({
        ...contact,
        isReachable: false
      }))

      return {
        ...contactGroup,
        members: [...reachableMembers, ...unreachableMembers]
      }
    })

  return [...suggestedContacts, ...suggestedGroups]
}
