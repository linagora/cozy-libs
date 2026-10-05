import { ThreadPrimitive, useThread } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useState } from 'react'

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
  // On mobile the conversation scrolls under the sidebar bar: once it has,
  // a fade below the bar dissolves the text instead of cutting it (at the
  // top of the scroll, the first message sits clear of the bar).
  const [isScrolled, setIsScrolled] = useState(false)

  return (
    <ThreadPrimitive.Root
      // The gutters: the messages and the composer are centered up to a max
      // width, and keep a margin from the edges when the screen is narrower
      className={cx(
        'u-flex u-flex-column u-flex-items-center u-flex-justify-between u-h-100 u-bxz u-pos-relative',
        isMobile ? 'u-ph-1' : 'u-ph-2',
        className
      )}
    >
      <ThreadPrimitive.Empty>
        <div
          className={cx(
            'u-pos-relative u-w-100 u-maw-7 u-mh-auto u-mb-3 u-flex u-flex-auto u-flex-items-center u-flex-justify-center',
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
            variant="h2"
            className={cx(
              'u-pos-relative u-fw-normal u-ta-center',
              styles['welcome-title']
            )}
          >
            {t('assistant.message.welcome')}
          </Typography>
        </div>
      </ThreadPrimitive.Empty>
      {isMobile && !isThreadEmpty && (
        <div
          aria-hidden="true"
          className={cx(styles['viewport-fade-top'], {
            [styles['viewport-fade-top--visible']]: isScrolled
          })}
        />
      )}
      <ThreadPrimitive.Viewport
        autoScroll
        onScroll={event => setIsScrolled(event.currentTarget.scrollTop > 0)}
        className={cx('u-w-100 u-bxz u-ov-auto', styles.conversationViewport, {
          'u-flex-auto': !isThreadEmpty,
          [styles['conversationViewport--filled']]: !isThreadEmpty,
          'u-mb-1': isThreadEmpty
        })}
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
      <div
        className={cx('u-w-100', {
          [styles['composer-dock']]: !isThreadEmpty
        })}
      >
        <ConversationComposer />
        <Typography
          variant="caption"
          color="textSecondary"
          component="p"
          className="u-w-100 u-maw-5-t u-maw-7 u-mh-auto u-mt-1-half  u-mb-0 u-ta-center"
        >
          {t('assistant.disclaimer')}
        </Typography>
      </div>
    </ThreadPrimitive.Root>
  )
}

export default Conversation
