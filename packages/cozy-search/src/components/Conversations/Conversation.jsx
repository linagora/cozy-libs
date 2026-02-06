import { ThreadPrimitive, useThread } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'
import { useI18n } from 'twake-i18n'

import { useQuery, isQueryLoading } from 'cozy-client'

import ConversationComposer from './ConversationComposer'
import AssistantMessage from '../Messages/AssistantMessage'
import UserMessage from '../Messages/UserMessage'
import { buildMyselfQuery } from '../queries'

const Conversation = ({ className }) => {
  const { t } = useI18n()
  const myselfQuery = buildMyselfQuery()
  const { ...queryMyselfResult } = useQuery(
    myselfQuery.definition,
    myselfQuery.options
  )

  const isLoading = isQueryLoading(queryMyselfResult)
  const isThreadEmpty = useThread(state => state.messages.length === 0)

  if (isLoading) return null

  return (
    <ThreadPrimitive.Root
      className={cx(
        'u-flex u-flex-column u-flex-items-center u-h-100',
        className,
        {
          'u-flex-justify-between': !isThreadEmpty,
          'u-flex-justify-center': isThreadEmpty
        }
      )}
    >
      <ThreadPrimitive.Viewport
        autoScroll
        className={cx('u-w-100 u-ov-auto u-mb-1', {
          'u-flex-auto': !isThreadEmpty
        })}
      >
        <ThreadPrimitive.Empty>
          <h2 className="u-mb-3 u-fw-normal u-ta-center">
            {t('assistant.message.welcome')}
          </h2>
        </ThreadPrimitive.Empty>
        <div className="u-maw-7 u-mh-auto">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              AssistantMessage: AssistantMessage
            }}
          />
        </div>
      </ThreadPrimitive.Viewport>
      <ConversationComposer />
    </ThreadPrimitive.Root>
  )
}

export default Conversation
