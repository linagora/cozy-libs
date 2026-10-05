import cx from 'classnames'
import React from 'react'
import { useParams } from 'react-router-dom'

import flag from 'cozy-flags'
import LoadMore from 'cozy-ui/transpiled/react/LoadMore'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import useConversation from '../../hooks/useConversation'
import useFetchConversations from '../../hooks/useFetchConversations'
import AssistantSidebarItem from '../Assistant/AssistantSidebarItem'
import ConversationList from '../Conversations/ConversationList'

export const SidebarConversations = () => {
  const { t } = useI18n()
  const { conversationId: currentConversationId } = useParams()
  const { goToConversation } = useConversation()
  const { conversations, hasMore, fetchMore } = useFetchConversations()

  return (
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
      <div
        className={cx(
          'u-flex-auto u-ov-auto u-ph-1 u-pb-half',
          styles['sidebar-conversations']
        )}
      >
        <ConversationList
          conversations={conversations}
          currentConversationId={currentConversationId}
          onOpenConversation={goToConversation}
        />
        {hasMore && (
          <div className="u-flex u-flex-items-center u-flex-justify-center u-mt-1">
            <LoadMore
              fetchMore={fetchMore}
              label={t('assistant.sidebar.conversation.actions.load_more')}
            />
          </div>
        )}
      </div>
    </>
  )
}
