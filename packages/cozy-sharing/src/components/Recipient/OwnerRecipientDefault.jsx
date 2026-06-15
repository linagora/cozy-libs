import React from 'react'

import { useClient, useQuery, hasQueryBeenLoaded } from 'cozy-client'

import MemberRecipient from './MemberRecipient'
import { buildInstanceSettingsQuery } from '../../queries/queries'

// When the owner is not part of a sharing's members (eg. the folder only has
// a link), there is no per-sharing avatar to reference. The instance's public
// avatar still holds the owner's picture. fallback=initials makes the stack
// serve a generated initials avatar (instead of the app icon) when no picture
// has been uploaded, matching how avatars are rendered everywhere else.
const OWNER_PUBLIC_AVATAR_PATH = '/public/avatar?fallback=initials'

const OwnerRecipientDefault = () => {
  const client = useClient()

  const instanceSettingsQuery = buildInstanceSettingsQuery()
  const instanceSettingsResult = useQuery(
    instanceSettingsQuery.definition,
    instanceSettingsQuery.options
  )

  return (
    hasQueryBeenLoaded(instanceSettingsResult) && (
      <MemberRecipient
        isOwner={true}
        status="owner"
        instance={client.options.uri}
        avatarPath={OWNER_PUBLIC_AVATAR_PATH}
        public_name={instanceSettingsResult?.data?.attributes?.public_name}
      />
    )
  )
}

export default OwnerRecipientDefault
