import { ThreadPrimitive, useThread } from '@assistant-ui/react'
import cx from 'classnames'
import React from 'react'

import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useCozyTheme } from 'cozy-ui/transpiled/react/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import ConversationComposer from './ConversationComposer'
import styles from './styles.styl'
import AssistantMessage from '../Messages/AssistantMessage'
import UserMessage from '../Messages/UserMessage'

const Conversation = ({ className }) => {
  const { t } = useI18n()
  const { isLight } = useCozyTheme()
  const { isMobile } = useBreakpoints()

  const isThreadEmpty = useThread(state => state.messages.length === 0)

  return (
    <ThreadPrimitive.Root
      // The gutters: the messages and the composer are centered up to a max
      // width, and keep a margin from the edges when the screen is narrower
      className={cx(
        'u-flex u-flex-column u-flex-items-center u-h-100 u-bxz',
        isMobile ? 'u-ph-1' : 'u-ph-2',
        className,
        {
          'u-flex-justify-between': !isThreadEmpty,
          'u-flex-justify-center': isThreadEmpty
        }
      )}
    >
      <ThreadPrimitive.Empty>
        <div
          className={cx(
            'u-pos-relative u-w-100 u-maw-7 u-mh-auto u-mb-3 u-flex u-flex-items-center u-flex-justify-center',
            styles['welcome']
          )}
        >
          <div
            aria-hidden="true"
            className={cx(styles['welcome-halo'], {
              [styles['welcome-halo--dark']]: !isLight
            })}
          />
          <Typography
            variant="h3"
            component="h2"
            className={cx(
              'u-pos-relative u-fw-normal u-ta-center',
              styles['welcome-title']
            )}
          >
            {t('assistant.message.welcome')}
          </Typography>
        </div>
      </ThreadPrimitive.Empty>
      <ThreadPrimitive.Viewport
        autoScroll
        className={cx(
          'u-w-100 u-bxz u-ov-auto u-mb-1',
          styles.conversationViewport,
          {
            'u-flex-auto': !isThreadEmpty
          }
        )}
      >
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
      <Typography
        variant="caption"
        color="textSecondary"
        component="p"
        className="u-w-100 u-maw-7 u-mh-auto u-mt-half u-mb-0 u-ta-center"
      >
        {t('assistant.disclaimer')}
      </Typography>
    </ThreadPrimitive.Root>
  )
}

export default Conversation
