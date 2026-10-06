import { ComposerPrimitive } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'

import styles from './styles.styl'

export const ConversationComposerRoot = ({ children }) => {
  const { isMobile } = useBreakpoints()
  const { isLight } = useCozyTheme()

  return (
    <ComposerPrimitive.Root
      className={cx(
        'u-w-100 u-maw-7 u-mh-auto u-bxz',
        styles['composerContainer'],
        {
          [styles['composerContainer--mobile']]: isMobile,
          [styles['composerContainer--mobile-dark']]: isMobile && !isLight
        }
      )}
    >
      {children}
    </ComposerPrimitive.Root>
  )
}
