import cx from 'classnames'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { Icon, CrossSmall, Magnifier, Menu, Plus } from '@linagora/twake-icons'
import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Divider from 'cozy-ui/transpiled/react/Divider'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import LoadMore from 'cozy-ui/transpiled/react/LoadMore'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'
import useFetchConversations from '../../hooks/useFetchConversations'
import AssistantSelection from '../Assistant/AssistantSelection'
import AssistantSidebarItem from '../Assistant/AssistantSidebarItem'
import { useAssistant } from '../AssistantProvider'
import PrettyScrollbar from '../Containers/PrettyScrollbar'
import ConversationList from '../Conversations/ConversationList'

const Sidebar = ({ className }) => {
  const { t } = useI18n()
  const { conversationId: currentConversationId } = useParams()
  const { createNewConversation, goToConversation } = useConversation()
  const { isOpenSearchConversation, setIsOpenSearchConversation } =
    useAssistant()
  const { isMobile } = useBreakpoints()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  const { conversations, hasMore, fetchMore } = useFetchConversations()

  // When the sidebar is closed on mobile, the toggle sits over the scrolling
  // conversation and must read as a distinct floating button, not blend into
  // the text behind it.
  const isFloatingToggle = !sidebarOpen && isMobile

  const onToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const onToggleSearch = () => {
    setIsOpenSearchConversation(!isOpenSearchConversation)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const onCreateNewConversation = () => {
    createNewConversation()
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <div
        className={cx('u-flex u-flex-column u-h-100 u-bdw-1', className, {
          'u-w-auto': !sidebarOpen,
          [styles['sidebar-container']]: sidebarOpen,
          'u-left-0 u-pos-absolute': isMobile
        })}
      >
        <div
          className={cx(
            'u-flex u-flex-items-center u-flex-justify-between u-pv-1',
            { 'u-ph-1-half': sidebarOpen, 'u-ph-1': !sidebarOpen }
          )}
        >
          <div
            className={cx('u-flex', {
              'u-bdrs-circle': isFloatingToggle,
              [styles['menu-toggle-floating']]: isFloatingToggle
            })}
          >
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              aria-label={t('assistant.sidebar.toggle_sidebar')}
            >
              <Icon icon={Menu} size={16} aria-hidden="true" />
            </IconButton>
          </div>
          {isFloatingToggle &&
            flag('cozy.assistant.create-assistant.enabled') && (
              <AssistantSelection borderless className="u-ml-half" />
            )}
          <div>
            {sidebarOpen &&
              flag('cozy.assistant.search-conversation.enabled') && (
                <IconButton
                  size="small"
                  onClick={onToggleSearch}
                  aria-label={t('assistant.sidebar.toggle_search')}
                >
                  <Icon icon={Magnifier} size={16} aria-hidden="true" />
                </IconButton>
              )}
            {sidebarOpen && isMobile && (
              <IconButton
                size="small"
                onClick={onToggleSidebar}
                aria-label={t('assistant.sidebar.close_sidebar')}
              >
                <Icon icon={CrossSmall} size={16} aria-hidden="true" />
              </IconButton>
            )}
          </div>
        </div>
        <div className="u-ph-1 u-pb-half">
          {sidebarOpen ? (
            <Button
              className="u-w-100 u-bdrs-6"
              label={t('assistant.sidebar.create_new')}
              startIcon={<Icon icon={Plus} />}
              fullWidth
              variant="primary"
              onClick={onCreateNewConversation}
            />
          ) : isMobile ? null : (
            <IconButton
              size="medium"
              className="u-bg-primaryColor u-white u-bdrs-6"
              onClick={onCreateNewConversation}
              aria-label={t('assistant.sidebar.create_new')}
            >
              <Icon icon={Plus} aria-hidden="true" />
            </IconButton>
          )}
        </div>

        {sidebarOpen && (
          <>
            {flag('cozy.assistant.create-assistant.enabled') && (
              <div className="u-ph-1 u-mt-1">
                <AssistantSidebarItem />
              </div>
            )}
            <Typography
              variant="caption"
              color="textSecondary"
              component="h2"
              className="u-ph-1 u-mt-1 u-mb-half"
            >
              {t('assistant.sidebar.recent_chats')}
            </Typography>
            <PrettyScrollbar className="u-flex-auto u-ov-auto u-ph-1 u-pb-half">
              <ConversationList
                conversations={conversations}
                currentConversationId={currentConversationId}
                onOpenConversation={goToConversation}
              />
              {hasMore && (
                <div className="u-flex u-flex-items-center u-flex-justify-center u-mt-1">
                  <LoadMore
                    fetchMore={fetchMore}
                    label={t(
                      'assistant.sidebar.conversation.actions.load_more'
                    )}
                  />
                </div>
              )}
            </PrettyScrollbar>
          </>
        )}
      </div>
      {isMobile && sidebarOpen && (
        <div
          className={styles['sidebar-overlay--mobile']}
          onClick={onToggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      {sidebarOpen && !isMobile && <Divider orientation="vertical" flexItem />}
    </>
  )
}

export default Sidebar
