import React, { useState } from 'react'

import { useClient, useQuery, hasQueryBeenLoaded } from 'cozy-client'
import { useI18n } from 'twake-i18n'

import DowngradePermissionConfirmDialog from './Recipient/DowngradePermissionConfirmDialog'
import { GroupRecipientDetail } from './Recipient/GroupRecipientDetail'
import WhoHasAccess from './WhoHasAccess'
import { makeMemberRoles, makeMembers } from '../helpers/members'
import {
  addAvatarUrls,
  hasMemberActions,
  makeAvatarUrl,
  markCurrentUser
} from '../helpers/recipients'
import { useMemberTypeChange } from '../hooks/useMemberTypeChange'
import { useSharingContext } from '../hooks/useSharingContext'
import { buildInstanceSettingsQuery } from '../queries/queries'

// When the owner is not part of a sharing's members (eg. the folder only has
// a link), there is no per-sharing avatar to reference. The instance's public
// avatar still holds the owner's picture. fallback=initials makes the stack
// serve a generated initials avatar (instead of the app icon) when no picture
// has been uploaded, matching how avatars are rendered everywhere else.
const OWNER_PUBLIC_AVATAR_PATH = '/public/avatar?fallback=initials'

const WhoHasAccessWrapper = ({
  isOwner = false,
  canManageSharing = isOwner,
  isReadOnly,
  canManageMembers = !isReadOnly,
  canManageLink = canManageMembers,
  showOwner = true,
  showEmptyState = false,
  recipients,
  recipientsToBeConfirmed = [],
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  verifyRecipient,
  link
}) => {
  const client = useClient()
  const { t } = useI18n()
  const [pendingIds, setPendingIds] = useState([])
  const [openedGroup, setOpenedGroup] = useState(null)
  const {
    isOrgSharedDrive,
    getDocumentPermissions,
    updateDocumentPermissions,
    revokeSharingLink,
    revokeGroup,
    revokeSelf
  } = useSharingContext()

  const instanceUri = client.options.uri
  const markedRecipients = addAvatarUrls(
    markCurrentUser(recipients, instanceUri),
    instanceUri
  )
  const hasMemberMenus = markedRecipients.some(
    recipient =>
      !recipient.members &&
      !recipientsToBeConfirmed.some(user => user.email === recipient.email) &&
      hasMemberActions({
        status: recipient.status,
        isCurrentUser: recipient.isCurrentUser,
        isOwner,
        canManageSharing,
        canManageMembers
      })
  )
  const {
    changeMemberType,
    isDowngradeDialogOpen,
    downgradedRecipient,
    sharedParentName,
    confirmDowngrade,
    cancelDowngrade
  } = useMemberTypeChange(document, {
    shouldFetchPath: hasMemberMenus
  })
  const ownerRecipient = markedRecipients.find(
    recipient => recipient.status === 'owner'
  )

  const instanceSettingsQuery = buildInstanceSettingsQuery()
  const instanceSettingsResult = useQuery(instanceSettingsQuery.definition, {
    ...instanceSettingsQuery.options,
    enabled: showOwner && !ownerRecipient
  })

  const defaultOwner = hasQueryBeenLoaded(instanceSettingsResult)
    ? {
        isOwner: true,
        status: 'owner',
        instance: instanceUri,
        avatarPath: OWNER_PUBLIC_AVATAR_PATH,
        avatarUrl: makeAvatarUrl(
          { status: 'owner', avatarPath: OWNER_PUBLIC_AVATAR_PATH },
          instanceUri
        ),
        public_name: instanceSettingsResult.data?.attributes?.public_name
      }
    : null

  const owner = ownerRecipient
    ? { ...ownerRecipient, isOrgSharedDrive: isOrgSharedDrive(document?._id) }
    : defaultOwner

  const members = makeMembers({
    t,
    owner: showOwner ? owner : null,
    recipients: markedRecipients,
    recipientsToBeConfirmed,
    isOwner,
    canManageSharing,
    canManageMembers,
    pendingIds,
    verifyRecipient,
    onOpenGroup: setOpenedGroup
  })
  const roles = makeMemberRoles(t)
  const permissions = getDocumentPermissions(document?._id)

  const handleRoleChange = (member, role) =>
    changeMemberType(
      {
        sharingId: member.data.sharingId,
        memberIndex: member.data.memberIndex,
        type: member.role,
        recipient: member.data
      },
      role
    )

  const removeMember = async member => {
    const recipient = member.data
    if (member.isGroup) {
      if (isOwner) {
        await revokeGroup(document, recipient.sharingId, recipient.groupIndex)
      } else {
        await revokeSelf(document)
      }
    } else if (recipient.isCurrentUser && !isOwner) {
      await onRevokeSelf(document)
    } else {
      await onRevoke(document, recipient.sharingId, recipient.memberIndex)
    }
  }

  const handleRemove = async member => {
    setPendingIds(ids => [...ids, member.id])
    try {
      await removeMember(member)
    } finally {
      setPendingIds(ids => ids.filter(id => id !== member.id))
    }
  }

  return (
    <>
      <WhoHasAccess
        members={members}
        roles={roles}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
        showEmptyState={showEmptyState}
        canManageLink={canManageLink}
        recipientsToBeConfirmed={recipientsToBeConfirmed}
        document={document}
        documentType={documentType}
        className={className}
        onRevoke={onRevoke}
        onRevokeSelf={onRevokeSelf}
        onUpdateLinkPermissions={updateDocumentPermissions}
        onRevokeLink={revokeSharingLink}
        link={link}
        permissions={permissions}
      />
      {isDowngradeDialogOpen && (
        <DowngradePermissionConfirmDialog
          document={document}
          recipient={downgradedRecipient}
          sharedParentName={sharedParentName}
          onCancel={cancelDowngrade}
          onConfirm={confirmDowngrade}
        />
      )}
      {openedGroup && (
        <GroupRecipientDetail
          isOwner={isOwner}
          name={openedGroup.name}
          members={openedGroup.members}
          onClose={() => setOpenedGroup(null)}
        />
      )}
    </>
  )
}

export default WhoHasAccessWrapper
