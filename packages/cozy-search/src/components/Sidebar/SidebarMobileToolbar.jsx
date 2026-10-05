import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'

import { SidebarToggleButton } from './SidebarToggleButton'
import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'
import AssistantSelection from '../Assistant/AssistantSelection'

export const SidebarMobileToolbar = ({ onToggle }) => {
  const { createNewConversation } = useConversation()

  return (
    <div
      // Must stay 48px high: the conversation is padded for it
      className={cx(
        'u-flex u-flex-items-center u-w-100 u-bxz u-left-0 u-pos-absolute u-ph-1 u-pv-half',
        styles['sidebar-mobile-toolbar']
      )}
    >
      <SidebarToggleButton onClick={onToggle} />
      {flag('cozy.assistant.create-assistant.enabled') && (
        // A conversation keeps the assistant it started with: picking
        // another one starts a new conversation, as from the sidebar
        <AssistantSelection
          borderless
          className="u-ml-half"
          onSelect={createNewConversation}
        />
      )}
    </div>
  )
}
