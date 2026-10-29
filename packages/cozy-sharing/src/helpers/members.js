import {
  getGroupRecipientSecondaryText,
  getMemberStatusText,
  hasMemberActions
} from './recipients'
import { getDisplayName, getInitials } from '../models'

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
  { t, isOwner, canManageMembers, onOpenGroup }
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
    canChangeRole: canManageGroup,
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
  const recipientConfirmationData = recipientsToBeConfirmed.find(
    user => user.email === recipient.email
  )
  const canManageMember = hasMemberActions({
    status: recipient.status,
    isCurrentUser: isMe,
    isOwner,
    canManageSharing,
    canManageMembers
  })

  return {
    id: recipient.index,
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
