import cx from 'classnames'
import React from 'react'

import Drawer from 'cozy-ui/transpiled/react/Drawer'

import { SidebarConversations } from './SidebarConversations'
import { SidebarHeader } from './SidebarHeader'
import { SidebarMobileToolbar } from './SidebarMobileToolbar'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './styles.styl'

export const SidebarMobile = ({
  className,
  open,
  onToggle,
  onClose,
  onToggleSearch,
  onCreateNewConversation
}) => {
  const handleToggleSearch = () => {
    onToggleSearch()
    onClose()
  }

  const handleCreateNewConversation = () => {
    onCreateNewConversation()
    onClose()
  }

  return (
    <>
      <SidebarMobileToolbar onToggle={onToggle} />
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        // Kept in the assistant dialog: a portal would lose the theme
        // class cozy-ui's Dialog sets on its own portal
        ModalProps={{ disablePortal: true }}
        className={styles['sidebar-drawer--mobile']}
        classes={{
          paper: cx(
            styles['sidebar-paper'],
            styles['sidebar-paper--mobile'],
            className
          )
        }}
      >
        <SidebarHeader
          isExpanded
          onToggle={onToggle}
          onToggleSearch={handleToggleSearch}
          onClose={onClose}
        />
        <SidebarNewChatButton
          isExpanded
          onClick={handleCreateNewConversation}
        />
        <SidebarConversations />
      </Drawer>
    </>
  )
}
