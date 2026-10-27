import React from 'react'

import { useClient, useQuery, hasQueryBeenLoaded } from 'cozy-client'

import WhoHasAccess from './WhoHasAccess'
import { markCurrentUser } from '../helpers/recipients'
import { useSharingContext } from '../hooks/useSharingContext'
import { buildInstanceSettingsQuery } from '../queries/queries'

// When the owner is not part of a sharing's members (eg. the folder only has
// a link), there is no per-sharing avatar to reference. The instance's public
// avatar still holds the owner's picture. fallback=initials makes the stack
// serve a generated initials avatar (instead of the app icon) when no picture
// has been uploaded, matching how avatars are rendered everywhere else.
const OWNER_PUBLIC_AVATAR_PATH = '/public/avatar?fallback=initials'

const WhoHasAccessWrapper = ({
  isOwner,
  canManageSharing,
  isSharedDrive,
  isReadOnly,
  canManageMembers,
  canManageLink,
  showOwner = true,
  recipients,
  recipientsToBeConfirmed,
  document,
  documentType,
  className,
  onRevoke,
  onRevokeSelf,
  verifyRecipient,
  link,
  permissions
}) => {
  const client = useClient()
  const { isOrgSharedDrive } = useSharingContext()

  const instanceUri = client.options.uri
  const markedRecipients = markCurrentUser(recipients, instanceUri)
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
      recipients={markedRecipients}
      recipientsToBeConfirmed={recipientsToBeConfirmed}
      document={document}
      documentType={documentType}
      className={className}
      onRevoke={onRevoke}
      onRevokeSelf={onRevokeSelf}
      verifyRecipient={verifyRecipient}
      link={link}
      permissions={permissions}
    />
  )
}

export default WhoHasAccessWrapper
