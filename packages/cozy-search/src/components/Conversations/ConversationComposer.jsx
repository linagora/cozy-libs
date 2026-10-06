import { useThread } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useCallback } from 'react'

import flag from 'cozy-flags'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import ConversationBar from './ConversationBar'
import { ConversationComposerRoot } from './ConversationComposerRoot'
import { ConversationSendButton } from './ConversationSendButton'
import styles from './styles.styl'
import AssistantSelection from '../Assistant/AssistantSelection'
import { useAssistant } from '../AssistantProvider'
import TwakeKnowledgeSelector from '../TwakeKnowledges/TwakeKnowledgeSelector'

const ConversationComposer = () => {
  const { isMobile } = useBreakpoints()
  const isRunning = useThread(state => state.isRunning)
  const isThreadEmpty = useThread(state => state.messages.length === 0)
  const { websearchEnabled, setWebsearchEnabled } = useAssistant()

  const handleToggleWebsearch = useCallback(() => {
    if (isRunning) return
    setWebsearchEnabled(prev => !prev)
  }, [isRunning, setWebsearchEnabled])

  // On mobile the send button sits by the text, the sources are icons and
  // the assistant chip picks the assistant; on desktop the send button ends
  // the chips row and the assistant is picked from the sidebar.
  return (
    <ConversationComposerRoot>
      <div className="u-flex u-flex-items-start u-flex-justify-between">
        <ConversationBar />
        {isMobile && (
          <div className="u-flex u-flex-items-center u-flex-shrink-0">
            <ConversationSendButton />
          </div>
        )}
      </div>

      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-between',
          styles['composerActions']
        )}
      >
        <div className="u-flex u-flex-items-center u-flex-wrap">
          {flag('cozy.assistant.create-assistant.enabled') && (
            <AssistantSelection
              disabled={!isThreadEmpty}
              selectable={isMobile}
              borderless={isMobile}
              className="u-mr-half"
            />
          )}
          {!isMobile && (
            <TwakeKnowledgeSelector
              websearchEnabled={websearchEnabled}
              onToggleWebsearch={handleToggleWebsearch}
            />
          )}
        </div>
        {isMobile ? (
          <TwakeKnowledgeSelector
            className="u-ml-auto"
            websearchEnabled={websearchEnabled}
            onToggleWebsearch={handleToggleWebsearch}
          />
        ) : (
          <ConversationSendButton />
        )}
      </div>
    </ConversationComposerRoot>
  )
}

export default ConversationComposer
