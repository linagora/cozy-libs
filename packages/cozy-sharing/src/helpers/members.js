import {
  getPrimaryCozy,
  getPrimaryEmail
} from 'cozy-client/dist/models/contact'

import {
  getGroupRecipientSecondaryText,
  getMemberStatusText,
  hasMemberActions,
  makeAvatarUrl
} from './recipients'
import { DOCTYPE_GROUPS, getDisplayName, getInitials } from '../models'

/**
 * Finds the confirmation data of a recipient waiting for the two steps
 * confirmation, by id or else by a non-empty email
 *
 * @param {object[]} recipientsToBeConfirmed - Recipients waiting for the confirmation
 * @param {object} recipient - Recipient of the sharing
 * @returns {object|undefined} Its confirmation data
 */
export const findRecipientConfirmationData = (
  recipientsToBeConfirmed,
  recipient
) =>
  recipientsToBeConfirmed.find(
    user => user.id !== undefined && user.id === recipient.id
  ) ??
  recipientsToBeConfirmed.find(
    user => Boolean(recipient.email) && user.email === recipient.email
  )

/**
 * @param {Function} t - Translation function
 * @returns {object[]} The roles a member can get, as `{ value, label }`
 */
export const makeMemberRoles = t => [
  { value: 'one-way', label: t('Share.type.one-way') },
  { value: 'two-way', label: t('Share.type.two-way') }
]

const makeOwnerMember = (owner, { t }) => {
  const isMe = Boolean(owner.isOwner) || Boolean(owner.isCurrentUser)

  return {
    id: owner.index ?? 'owner',
    name: getDisplayName(owner),
    subtitle: getMemberStatusText({
      t,
      status: 'owner',
      isMe,
      instance: owner.instance,
      email: owner.email,
      name: owner.name || owner.public_name,
      isOrgSharedDrive: owner.isOrgSharedDrive
    }),
    avatarUrl: owner.avatarUrl,
    initials: getInitials(owner),
    isOwner: true,
    isCurrentUser: isMe,
    data: owner
  }
}

const makeGroupMember = (
  group,
  { t, isOwner, canManageMembers, isGroupRoleMenuShown, onOpenGroup }
) => {
  const isUserInsideMembers = group.members.some(member => member.isCurrentUser)
  const role = group.read_only ? 'one-way' : 'two-way'
  const canManageGroup = canManageMembers && (isOwner || isUserInsideMembers)

  return {
    id: group.index,
    name: group.name,
    subtitle: getGroupRecipientSecondaryText({
      t,
      nbMember: group.members.length,
      nbMemberReady: group.members.filter(
        member => !['revoked', 'mail-not-sent'].includes(member.status)
      ).length,
      isUserInsideMembers
    }),
    color: group.color,
    isGroup: true,
    role,
    roles: [{ value: role, label: t(`Share.type.${role}`) }],
    canChangeRole: canManageGroup && isGroupRoleMenuShown,
    canRemove: canManageGroup,
    onClick: () => onOpenGroup(group),
    data: group
  }
}

const makeRecipientMember = (
  recipient,
  {
    t,
    isOwner,
    canManageSharing,
    canManageMembers,
    recipientsToBeConfirmed,
    verifyRecipient
  }
) => {
  const isMe = Boolean(recipient.isCurrentUser)
  const recipientConfirmationData = findRecipientConfirmationData(
    recipientsToBeConfirmed,
    recipient
  )
  const canManageMember = hasMemberActions({
    status: recipient.status,
    isCurrentUser: isMe,
    isOwner,
    canManageSharing,
    canManageMembers
  })

  return {
    id: recipient.recipientId ?? recipient.index,
    name: getDisplayName(recipient),
    subtitle: getMemberStatusText({
      t,
      status: recipient.status,
      isMe,
      instance: recipient.instance,
      email: recipient.email,
      name: recipient.name || recipient.public_name
    }),
    avatarUrl: recipient.avatarUrl,
    initials: getInitials(recipient),
    isCurrentUser: isMe,
    role: recipient.type ?? 'one-way',
    canChangeRole: canManageMember,
    canRemove: canManageMember,
    action: recipientConfirmationData
      ? {
          label: t('Share.twoStepsConfirmation.verify'),
          onClick: () => verifyRecipient(recipientConfirmationData)
        }
      : undefined,
    data: recipient
  }
}

/**
 * Makes the members of a sharing to display with `MemberList`
 *
 * @param {object} params
 * @param {Function} params.t - Translation function
 * @param {object} [params.owner] - Owner of the sharing, displayed first
 * @param {object[]} params.recipients - Recipients of the sharing, flagged by
 * `markCurrentUser` and with their `avatarUrl`
 * @param {object[]} [params.recipientsToBeConfirmed] - Recipients waiting for
 * the two steps confirmation
 * @param {boolean} params.isOwner - Whether the current user owns the sharing
 * @param {boolean} params.canManageSharing - Whether the current user can manage the sharing
 * @param {boolean} params.canManageMembers - Whether the members can be managed
 * @param {boolean} [params.isGroupRoleMenuShown] - Whether to show the role of
 * the groups in a menu, though it cannot be changed, rather than as text
 * @param {string[]} [params.pendingIds] - Ids of the members being removed
 * @param {Function} [params.verifyRecipient] - Starts the confirmation of a recipient
 * @param {Function} params.onOpenGroup - Opens the detail of a group recipient
 * @returns {object[]} The members, each one with its recipient as `data`
 */
export const makeMembers = ({
  t,
  owner,
  recipients,
  recipientsToBeConfirmed = [],
  isOwner,
  canManageSharing,
  canManageMembers,
  isGroupRoleMenuShown = false,
  pendingIds = [],
  verifyRecipient,
  onOpenGroup
}) => {
  const members = recipients
    .filter(recipient => recipient.status !== 'owner')
    .map(recipient =>
      recipient.members
        ? makeGroupMember(recipient, {
            t,
            isOwner,
            canManageMembers,
            isGroupRoleMenuShown,
            onOpenGroup
          })
        : makeRecipientMember(recipient, {
            t,
            isOwner,
            canManageSharing,
            canManageMembers,
            recipientsToBeConfirmed,
            verifyRecipient
          })
    )
    .map(member => ({ ...member, isPending: pendingIds.includes(member.id) }))

  return owner ? [makeOwnerMember(owner, { t }), ...members] : members
}

/**
 * Makes a member for `MemberAutocomplete` from a contact, a group of contacts
 * or a typed email
 *
 * @param {object} params
 * @param {object} params.contact - Contact, group of contacts or `{ email }`
 * @param {Function} params.t - Translation function
 * @param {string} params.instanceUri - URI of the current user's instance
 * @returns {object} The member, with the contact or group as `data`
 */
export const makeMemberFromContact = ({ contact, t, instanceUri }) => {
  if (contact._type === DOCTYPE_GROUPS) {
    const memberCount = contact.member_count ?? contact.members?.length
    return {
      id: contact._id ?? contact.id,
      name: contact.name,
      subtitle:
        memberCount !== undefined
          ? t('Share.members.count', { smart_count: memberCount })
          : undefined,
      color: contact.color || undefined,
      isGroup: true,
      data: contact
    }
  }

  return {
    id: contact._id ?? contact.id ?? contact.email,
    name: getDisplayName(contact),
    subtitle: getPrimaryCozy(contact) || '-',
    email: getPrimaryEmail(contact),
    initials: getInitials(contact),
    avatarUrl: makeAvatarUrl(contact, instanceUri),
    data: contact
  }
}

export const makeMembersFromContacts = ({ contacts, t, instanceUri }) =>
  contacts.map(contact => makeMemberFromContact({ contact, t, instanceUri }))
