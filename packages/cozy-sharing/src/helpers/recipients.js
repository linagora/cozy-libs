import { getPrimaryCozy } from 'cozy-client/dist/models/contact'
import flag from 'cozy-flags'

import { DOCTYPE_GROUPS } from '../models'

export const DEFAULT_DISPLAY_NAME = 'Share.contacts.defaultDisplayName'

export const filterAndReworkRecipients = (recipients, previousRecipients) => {
  return recipients
    .filter(recipient => recipient.status !== 'owner')
    .map(recipient => {
      const recipientHasChanged =
        previousRecipients &&
        !previousRecipients.find(
          previousRecipient =>
            previousRecipient.name === recipient.name &&
            previousRecipient.email === recipient.email
        )

      if (recipientHasChanged) {
        return { ...recipient, hasBeenJustAdded: true }
      }

      return recipient
    })
}

export const FADE_IN_DURATION = 600

/**
 * @returns {boolean} the maximum recipients limit by document
 */
export const computeRecipientsLimit = () => {
  const flagLimit = flag('sharing.recipients-limit')
  if (flagLimit !== null) {
    return flagLimit
  }
  return 100
}

/**
 * @param {object[]} current List of current recipients
 * @param {object[]} next List of next recipients
 * @returns {boolean} whether total number of recipients has reach the limit
 */
export const hasReachRecipientsLimit = (current, next) => {
  const limit = computeRecipientsLimit()
  if (current.length + next.length > limit) {
    return true
  }
  return false
}

/**
 * Merges the recipients list with a new recipient and their associated contacts.
 * Only used when flag sharing.show-recipient-groups is not enabled.
 * @param {object[]} recipients - The list of recipients.
 * @param {object} recipient - The new recipient.
 * @param {object[]} contacts - The list of contacts.
 * @returns {object[]} - The merged recipients list.
 */
export const spreadGroupAndMergeRecipients = (recipients, newRecipient) => {
  let contactsToAdd
  if (newRecipient._type === DOCTYPE_GROUPS) {
    contactsToAdd = newRecipient.members
  } else {
    contactsToAdd = [newRecipient]
  }

  const filtered = contactsToAdd
    .filter(
      contact =>
        (contact.email && contact.email.length > 0) ||
        (contact.cozy && contact.cozy.length > 0)
    )
    .filter(contact => !recipients.find(r => r === contact))

  return [...recipients, ...filtered]
}

export const mergeRecipients = (recipients, newRecipient) => {
  return [...recipients, newRecipient]
}

export const getGroupRecipientSecondaryText = ({
  nbMember,
  nbMemberReady,
  t,
  isUserInsideMembers
}) => {
  const memberCount =
    nbMember === nbMemberReady ? nbMember : [nbMemberReady, nbMember].join('/')
  const secondary = t('GroupRecipient.secondary', {
    memberCount,
    smart_count: nbMember
  })

  return (
    secondary +
    (isUserInsideMembers ? ` (${t('GroupRecipient.secondary_you')})` : '')
  )
}

const isInstance = (recipient, instanceUri) =>
  recipient.instance !== undefined && recipient.instance === instanceUri

/**
 * Flags with `isCurrentUser` the recipients, and the members of group
 * recipients, whose instance is the current user's one
 *
 * @param {object[]} recipients - Recipients of a sharing
 * @param {string} instanceUri - URI of the current user's instance
 * @returns {object[]} The recipients with their `isCurrentUser` flag
 */
export const markCurrentUser = (recipients, instanceUri) =>
  recipients.map(recipient => ({
    ...recipient,
    isCurrentUser: isInstance(recipient, instanceUri),
    ...(recipient.members && {
      members: recipient.members.map(member => ({
        ...member,
        isCurrentUser: isInstance(member, instanceUri)
      }))
    })
  }))

/**
 * @param {object} params
 * @param {string} params.status - Status of the member in the sharing
 * @param {boolean} params.isCurrentUser - Whether the member is the current user
 * @param {boolean} params.isOwner - Whether the current user owns the sharing
 * @param {boolean} params.canManageSharing - Whether the current user can manage the sharing
 * @param {boolean} params.canManageMembers - Whether the members can be managed
 * @returns {boolean} Whether the current user can change the member's
 * permission type or revoke them
 */
export const hasMemberActions = ({
  status,
  isCurrentUser,
  isOwner,
  canManageSharing,
  canManageMembers
}) =>
  canManageMembers &&
  status !== 'owner' &&
  ((isCurrentUser && !isOwner) || canManageSharing)

/**
 * makeAvatarUrl derives the avatar image URL for the recipient.
 * - If the recipient has an avatarPath (sharing context), it is
 *   used directly with a base URI prefix (unless it is already
 *   a full URL for a remote Cozy).
 * - If the recipient has no avatarPath but has a cozy URL
 *   (contact context), it points to that Cozy's public avatar.
 * - The status is used as a cache-buster in the URL so the
 *   browser refreshes the image when the sharing status changes.
 *   For non-sharing recipients, 'contact' is the stable default.
 */
export const makeAvatarUrl = (recipient, instanceUri) => {
  const avatarPath = recipient.avatarPath
  const cozyUrl = !avatarPath ? getPrimaryCozy(recipient) : null
  if (!avatarPath && !cozyUrl) return null

  const finalPath =
    avatarPath ||
    `${cozyUrl.replace(/\/$/, '')}/public/avatar?fallback=initials`
  const status = recipient.status || 'contact'
  const isFullPath = finalPath.startsWith('http')
  const base = isFullPath ? '' : instanceUri
  return `${base}${finalPath}${finalPath.includes('?') ? '&' : '?'}v=${status}`
}

/**
 * Adds to the recipients, except groups, the URL of their avatar
 *
 * @param {object[]} recipients - Recipients of a sharing
 * @param {string} instanceUri - URI of the current user's instance
 * @returns {object[]} The recipients with their `avatarUrl`
 */
export const addAvatarUrls = (recipients, instanceUri) =>
  recipients.map(recipient =>
    recipient.members
      ? recipient
      : { ...recipient, avatarUrl: makeAvatarUrl(recipient, instanceUri) }
  )
