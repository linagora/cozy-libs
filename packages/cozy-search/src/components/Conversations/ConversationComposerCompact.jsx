import { useComposer } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useState } from 'react'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import { ConversationComposerRoot } from './ConversationComposerRoot'
import { ConversationSendButton } from './ConversationSendButton'
import styles from './styles.styl'

export const ConversationComposerCompact = () => {
  const { isMobile } = useBreakpoints()
  const isEmpty = useComposer(state => state.isEmpty)
  const [isMultiline, setIsMultiline] = useState(false)

  // Stays multiline until emptied: once the send button leaves its side,
  // the wider input could fit the text on one line and toggle in a loop
  if (isEmpty && isMultiline) {
    setIsMultiline(false)
  }

  const handleHeightChange = (height, { rowHeight }) => {
    if (height > rowHeight) {
      setIsMultiline(true)
    }
  }

  const isExpanded = !isMobile && isMultiline

  return (
    <ConversationComposerRoot
      className={cx(styles['composerContainer--compact'], {
        [styles['composerContainer--single-line']]: !isMobile && !isMultiline
      })}
    >
      <div className="u-flex u-flex-items-start u-flex-justify-between">
        <ConversationBar onHeightChange={handleHeightChange} />
        {!isExpanded && (
          <div className="u-flex u-flex-items-center u-flex-shrink-0">
            <ConversationSendButton />
          </div>
        )}
      </div>
      {isExpanded && (
        <div
          className={cx('u-flex u-flex-justify-end', styles['composerActions'])}
        >
          <ConversationSendButton />
        </div>
      )}
    </ConversationComposerRoot>
  )
}
