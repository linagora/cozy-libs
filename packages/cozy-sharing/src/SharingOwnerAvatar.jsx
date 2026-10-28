import React from 'react'

import { MemberAvatarWrapper } from './components/Avatar/MemberAvatarWrapper'
import SharingContext from './context'
import withLocales from './hoc/withLocales'

export const SharingOwnerAvatar = withLocales(({ docId, ...rest }) => (
  <SharingContext.Consumer>
    {({ byDocId, getOwner } = {}) => {
      return !byDocId || !byDocId[docId] ? null : (
        <MemberAvatarWrapper recipient={getOwner(docId)} {...rest} />
      )
    }}
  </SharingContext.Consumer>
))
