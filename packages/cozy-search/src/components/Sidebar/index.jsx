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

  // Closed on mobile, the sidebar shrinks to an opaque bar over the top of
  // the conversation (the toggle and the assistant chip), the text
  // scrolling under it.
  const isMobileBar = !sidebarOpen && isMobile
  // Closed on desktop, the sidebar is a narrow rail with the toggle and the
  // new-chat button centered in it.
  const isRail = !sidebarOpen && !isMobile

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
        // The host's bottom padding of the sidebar is not for the bar, which
        // must be exactly 48px: the conversation is padded for that height
        className={cx(
          'u-flex u-flex-column u-bdw-1',
          !isMobileBar && className,
          {
            'u-h-100': !isMobileBar,
            'u-w-100': isMobileBar,
            [styles['sidebar-container']]: sidebarOpen,
            [styles['sidebar-rail']]: isRail,
            [styles['sidebar-bar--mobile']]: isMobileBar,
            'u-left-0 u-pos-absolute': isMobile
          }
        )}
      >
        <div
          className={cx('u-flex u-flex-items-center', {
            'u-ph-1-half u-pv-1 u-flex-justify-between': sidebarOpen,
            'u-ph-1 u-pv-1 u-flex-justify-center': isRail,
            'u-ph-1 u-pv-half u-flex-justify-between': isMobileBar
          })}
        >
          <div className="u-flex u-flex-items-center">
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              aria-label={t('assistant.sidebar.toggle_sidebar')}
            >
              <Icon icon={Menu} size={16} aria-hidden="true" />
            </IconButton>
            {isMobileBar && flag('cozy.assistant.create-assistant.enabled') && (
              // A conversation keeps the assistant it started with: picking
              // another one starts a new conversation, as from the sidebar
              <AssistantSelection
                borderless
                className="u-ml-half"
                onSelect={createNewConversation}
              />
            )}
          </div>
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
        {!isMobileBar && (
          <div
            className={cx('u-ph-1 u-pb-half', {
              'u-flex u-flex-justify-center': isRail
            })}
          >
            {sidebarOpen ? (
              <Button
                className="u-w-100 u-bdrs-6"
                label={t('assistant.sidebar.create_new')}
                startIcon={<Icon icon={Plus} />}
                fullWidth
                variant="primary"
                onClick={onCreateNewConversation}
              />
            ) : (
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
        )}

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
