import React, { useState } from 'react'

import Avatar from 'cozy-ui/transpiled/react/Avatar'

import logger from '../../logger'
import { getInitials } from '../../models'

const MemberAvatar = ({ recipient, avatarUrl, ...rest }) => {
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

  // The avatar can become unreachable (eg. the related sharing is revoked
  // while its members are still rendered), in which case the image request
  // fails. Without a fallback the browser shows a broken-image icon, so we
  // render the initials instead.
  return (
    <Avatar {...rest}>
      {avatarUrl && erroredSrc !== avatarUrl ? (
        <img
          width="100%"
          height="100%"
          src={avatarUrl}
          onError={() => setErroredSrc(avatarUrl)}
        />
      ) : (
        getInitials(recipient)
      )}
    </Avatar>
  )
}

export { MemberAvatar }
