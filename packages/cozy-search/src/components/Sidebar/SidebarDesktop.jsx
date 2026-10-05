import cx from 'classnames'
import React from 'react'

import Drawer from 'cozy-ui/transpiled/react/Drawer'

import { SidebarConversations } from './SidebarConversations'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './styles.styl'

export const SidebarDesktop = ({
  className,
  open,
  onToggle,
  onToggleSearch,
  onCreateNewConversation
}) => {
  return (
    <Drawer
      variant="permanent"
      className="u-h-100"
      classes={{
        paper: cx(
          styles['sidebar-paper'],
          styles['sidebar-paper--docked'],
          { [styles['sidebar-paper--rail']]: !open },
          className
        )
      }}
    >
      <SidebarHeader
        isExpanded={open}
        onToggle={onToggle}
        onToggleSearch={onToggleSearch}
      />
      <SidebarNewChatButton
        isExpanded={open}
        onClick={onCreateNewConversation}
      />
      {open && <SidebarConversations />}
    </Drawer>
  )
}
