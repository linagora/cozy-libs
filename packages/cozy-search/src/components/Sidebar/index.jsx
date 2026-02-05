import cx from 'classnames'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import { useQuery } from 'cozy-client'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import BurgerIcon from 'cozy-ui/transpiled/react/Icons/Burger'
import SearchIcon from 'cozy-ui/transpiled/react/Icons/Magnifier'
import PlusIcon from 'cozy-ui/transpiled/react/Icons/Plus'
import Typography from 'cozy-ui/transpiled/react/Typography'

import useConversation from '../../hooks/useConversation'
import { useAssistant } from '../AssistantProvider'
import ConversationList from '../Conversations/ConversationList'
import { buildChatConversationsQuery } from '../queries'

const Sidebar = () => {
  const { t } = useI18n()
  const { conversationId: currentConversationId } = useParams()
  const { createNewConversation, goToConversation } = useConversation()
  const { isOpenSearchConversation, setIsOpenSearchConversation } =
    useAssistant()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const conversationsQuery = buildChatConversationsQuery()
  const { data: conversations } = useQuery(
    conversationsQuery.definition,
    conversationsQuery.options
  )

  const onToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const onToggleSearch = () => {
    setIsOpenSearchConversation(!isOpenSearchConversation)
  }

  return (
    <div className="u-flex u-flex-column u-h-100 u-bdw-1">
      <div className="u-flex u-flex-items-center u-flex-justify-between u-ph-half u-pb-1">
        <IconButton
          size="medium"
          className={cx('u-bdrs-6', {
            'u-bg-primaryBackgroundLight': sidebarOpen
          })}
          onClick={onToggleSidebar}
        >
          <Icon icon={BurgerIcon} />
        </IconButton>
        {sidebarOpen && (
          <IconButton
            size="medium"
            className="u-bdrs-6"
            onClick={onToggleSearch}
          >
            <Icon icon={SearchIcon} />
          </IconButton>
        )}
      </div>
      <div className="u-ph-half u-pb-1">
        {sidebarOpen ? (
          <Button
            className="u-w-100 u-bdrs-6"
            label={t('assistant.sidebar.create_new')}
            startIcon={<Icon icon={PlusIcon} />}
            fullWidth
            variant="primary"
            onClick={createNewConversation}
          />
        ) : (
          <IconButton
            size="medium"
            className="u-bg-primaryColor u-white u-bdrs-6"
            onClick={createNewConversation}
          >
            <Icon icon={PlusIcon} />
          </IconButton>
        )}
      </div>

      {sidebarOpen && (
        <>
          <Typography variant="h6" className="u-p-half">
            Recent chats
          </Typography>
          <div className="u-flex-auto u-ov-auto u-p-half">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onOpenConversation={goToConversation}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar
