import React from 'react'

import { useClient, useQuery, hasQueryBeenLoaded } from 'cozy-client'

import WhoHasAccess from './WhoHasAccess'
import {
  addAvatarUrls,
  hasMemberActions,
  makeAvatarUrl,
  markCurrentUser
} from '../helpers/recipients'
import { useMemberPermissionType } from '../hooks/useMemberPermissionType'
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
  isSharedDrive,
  isReadOnly,
  canManageMembers = !isReadOnly,
  canManageLink,
  showOwner = true,
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
  const { isInsideSharedParent, sharedParentName, setMemberType } =
    useMemberPermissionType(document, { shouldFetchPath: hasMemberMenus })
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

  return (
    <WhoHasAccess
      isOwner={isOwner}
      canManageSharing={canManageSharing}
      isSharedDrive={isSharedDrive}
      isReadOnly={isReadOnly}
      canManageMembers={canManageMembers}
      canManageLink={canManageLink}
      showOwner={showOwner}
      owner={owner}
      isInsideSharedParent={isInsideSharedParent}
      sharedParentName={sharedParentName}
      recipients={markedRecipients}
      recipientsToBeConfirmed={recipientsToBeConfirmed}
      document={document}
      documentType={documentType}
      className={className}
      onRevoke={onRevoke}
      onRevokeSelf={onRevokeSelf}
      onRevokeGroup={revokeGroup}
      onLeaveGroup={revokeSelf}
      onSetMemberType={setMemberType}
      onUpdateLinkPermissions={updateDocumentPermissions}
      onRevokeLink={revokeSharingLink}
      verifyRecipient={verifyRecipient}
      link={link}
      permissions={getDocumentPermissions(document?._id)}
    />
  )
}

export default WhoHasAccessWrapper
