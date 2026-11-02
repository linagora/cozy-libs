import React from 'react'

import { MemberAvatarWrapper } from './components/Avatar/MemberAvatarWrapper'
import SharingContext from './context'
import withLocales from './hoc/withLocales'

export const SharingOwnerAvatar = withLocales(({ docId, ...rest }) => (
  <SharingContext.Consumer>
    {({ byDocId, getOwner } = {}) => {
      const owner = byDocId?.[docId] ? getOwner(docId) : undefined
      const hasOwner = owner !== undefined

      return hasOwner ? (
        <MemberAvatarWrapper recipient={owner} {...rest} />
      ) : null
    }}
  </SharingContext.Consumer>
))
