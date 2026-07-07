import React, { useState } from 'react'

import { useClient } from 'cozy-client'
import { getPrimaryCozy } from 'cozy-client/dist/models/contact'
import Avatar from 'cozy-ui/transpiled/react/Avatar'

import logger from '../../logger'
import { getInitials } from '../../models'

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
const makeAvatarUrl = (recipient, instanceUri) => {
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

const MemberAvatar = ({ recipient, ...rest }) => {
  const client = useClient()
  // Remember which image url failed to load so we can fall back to the
  // initials. Storing the url (instead of a boolean) means a new url is
  // retried automatically, without an effect to reset the error state.
  const [erroredSrc, setErroredSrc] = useState(null)

  // There are cases when due to apparent memory leaks, the recipient does not exist
  // This will trigger an unhanded error in the Avatar component and crash the app
  // At the moment, we are not sure where is the root cause of this cascading undefined props
  // Nevertheless, we can prevent the crash by returning null if the recipient is undefined
  if (!recipient) {
    // eslint-disable-next-line
    logger.warn('RecipientAvatar: recipient is missing, see props:', { recipient, ...rest })
    return null
  }

  const image = makeAvatarUrl(recipient, client.options.uri)

  // The avatar can become unreachable (eg. the related sharing is revoked
  // while its members are still rendered), in which case the image request
  // fails. Without a fallback the browser shows a broken-image icon, so we
  // render the initials instead.
  return (
    <Avatar {...rest}>
      {image && erroredSrc !== image ? (
        <img
          width="100%"
          height="100%"
          src={image}
          onError={() => setErroredSrc(image)}
        />
      ) : (
        getInitials(recipient)
      )}
    </Avatar>
  )
}

export { MemberAvatar }
