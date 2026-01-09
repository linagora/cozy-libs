/**
 * CozyThread composes assistant-ui's ThreadPrimitive with custom Cozy components.
 *
 * Features:
 * - Auto-scrolling viewport
 * - Custom message components using cozy-ui styling
 * - Integrated composer at bottom
 * - Centered messages with max-width
 */

import React from 'react'

import { useQuery, isQueryLoading } from 'cozy-client'
import { ThreadPrimitive } from '@assistant-ui/react'

import CozyUserMessage from './CozyUserMessage'
import CozyAssistantMessage from './CozyAssistantMessage'
import CozyComposer from './CozyComposer'
import { buildMyselfQuery } from '../queries'
import styles from './styles.styl'

interface CozyThreadProps {
  className?: string
}

const CozyThread = ({ className }: CozyThreadProps) => {
  // Query user contact info for avatar
  const myselfQuery = buildMyselfQuery()
  const { data: myselves, ...queryResult } = useQuery(
    myselfQuery.definition,
    myselfQuery.options
  )

  const isLoading = isQueryLoading(queryResult)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myself = (myselves as any)?.[0]

  if (isLoading) return null

  return (
    <ThreadPrimitive.Root className={`${className || ''} ${styles['cozyThread-root']}`}>
      <ThreadPrimitive.Viewport className={styles['cozyThread-viewport']}>
        <div className={styles['cozyThread-messages']}>
          <ThreadPrimitive.Messages
            components={{
              UserMessage: () => <CozyUserMessage myself={myself} />,
              AssistantMessage: CozyAssistantMessage
            }}
          />
        </div>
      </ThreadPrimitive.Viewport>
      <div className={styles['cozyThread-composer']}>
        <CozyComposer />
      </div>
    </ThreadPrimitive.Root>
  )
}

export default CozyThread
