import { useThread } from '@assistant-ui/react'
import React, { useCallback } from 'react'

import flag from 'cozy-flags'

import AssistantSelection from '../Assistant/AssistantSelection'
import { useAssistant } from '../AssistantProvider'
import TwakeKnowledgeSelector from '../TwakeKnowledges/TwakeKnowledgeSelector'

const CozyComposerExtras = ({ disabled }) => {
  const isRunning = useThread(state => state.isRunning)
  const { websearchEnabled, setWebsearchEnabled } = useAssistant()

  const handleToggleWebsearch = useCallback(() => {
    if (isRunning) return
    setWebsearchEnabled(prev => !prev)
  }, [isRunning, setWebsearchEnabled])

  return (
    <>
      {flag('cozy.assistant.create-assistant.enabled') && (
        <AssistantSelection disabled={disabled} />
      )}
      <TwakeKnowledgeSelector
        className="u-ml-auto"
        websearchEnabled={websearchEnabled}
        onToggleWebsearch={handleToggleWebsearch}
      />
    </>
  )
}

export default CozyComposerExtras
