import cx from 'classnames'
import React, { useRef, useState } from 'react'

import { Icon, Apps, Dropdown } from '@linagora/twake-icons'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import { useI18n } from 'twake-i18n'

import AssistantMenu from './AssistantMenu'
import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'

/**
 * The "Assistant" item of the sidebar: opens the assistant menu. Picking
 * an assistant starts a new conversation with it, since a conversation
 * keeps the assistant it started with.
 */
const AssistantSidebarItem = ({ className }) => {
  const { t } = useI18n()
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { createNewConversation } = useConversation()

  return (
    <>
      <ListItem
        button
        ref={anchorRef}
        onClick={() => setOpen(true)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx('u-ph-half', styles['sidebar-item'], className)}
      >
        <ListItemIcon className={styles['sidebar-item-icon']}>
          <Icon icon={Apps} size={16} aria-hidden="true" />
        </ListItemIcon>
        <ListItemText
          className="u-m-0"
          primary={t('assistant.sidebar.assistant')}
          primaryTypographyProps={{ variant: 'body2' }}
        />
        <Icon
          icon={Dropdown}
          size={16}
          color="var(--iconTextColor)"
          aria-hidden="true"
        />
      </ListItem>
      <AssistantMenu
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        onSelect={createNewConversation}
      />
    </>
  )
}

export default AssistantSidebarItem
