import cx from 'classnames'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Divider from 'cozy-ui/transpiled/react/Divider'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import BurgerIcon from 'cozy-ui/transpiled/react/Icons/Burger'
import CrossSmallIcon from 'cozy-ui/transpiled/react/Icons/CrossSmall'
import SearchIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import LoadMore from 'cozy-ui/transpiled/react/LoadMore'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'
import useFetchConversations from '../../hooks/useFetchConversations'
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

  const onToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const onToggleSearch = () => {
    setIsOpenSearchConversation(!isOpenSearchConversation)
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
        <div className="u-flex u-flex-items-center u-flex-justify-between u-ph-half u-pv-1">
          <IconButton
            size="medium"
            className={cx('u-bdrs-6 u-p-0')}
            onClick={onToggleSidebar}
            aria-label={t('assistant.sidebar.toggle_sidebar')}
          >
            <Button
              component="div"
              variant={sidebarOpen ? 'ghost' : 'text'}
              className="u-miw-auto u-w-2-half u-h-2-half u-bdrs-6"
              classes={{ label: 'u-flex u-w-auto' }}
              label={<Icon icon={BurgerIcon} aria-hidden="true" />}
            />
          </IconButton>
          <div>
            {sidebarOpen &&
              flag('cozy.assistant.search-conversation.enabled') && (
                <IconButton
                  size="medium"
                  className="u-bdrs-6"
                  onClick={onToggleSearch}
                  aria-label={t('assistant.sidebar.toggle_search')}
                >
                  <Icon icon={SearchIcon} aria-hidden="true" />
                </IconButton>
              )}
            {sidebarOpen && isMobile && (
              <IconButton
                size="medium"
                className="u-bdrs-6"
                onClick={onToggleSidebar}
                aria-label={t('assistant.sidebar.close_sidebar')}
              >
                <Icon icon={CrossSmallIcon} aria-hidden="true" />
              </IconButton>
            )}
          </div>
        </div>
        <div className="u-ph-half u-pb-half">
          {sidebarOpen ? (
            <Button
              className="u-w-100 u-bdrs-6"
              label={t('assistant.sidebar.create_new')}
              startIcon={<Icon icon={PlusIcon} />}
              fullWidth
              variant="primary"
              onClick={createNewConversation}
            />
          ) : isMobile ? null : (
            <IconButton
              size="medium"
              className="u-bg-primaryColor u-white u-bdrs-6"
              onClick={createNewConversation}
              aria-label={t('assistant.sidebar.create_new')}
            >
              <Icon icon={PlusIcon} aria-hidden="true" />
            </IconButton>
          )}
        </div>

        {sidebarOpen && (
          <>
            <Typography variant="h6" className="u-ml-1 u-p-half">
              {t('assistant.sidebar.recent_chats')}
            </Typography>
            <PrettyScrollbar className="u-flex-auto u-ov-auto u-ph-half u-pb-half">
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
