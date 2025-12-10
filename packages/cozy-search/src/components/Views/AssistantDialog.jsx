import React from 'react'

import Dialog from 'cozy-ui/transpiled/react/Dialog'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import AssistantProvider from '../AssistantProvider'
import ConversationView from './ConversationView'

const AssistantDialog = () => {
  return (
    <Dialog open fullScreen size="full" disableGutters>
      <ConversationView />
    </Dialog>
  )
}

const AssistantDialogWithProviders = () => {
  return (
    <CozyTheme variant="normal">
      <AssistantProvider>
        <AssistantDialog />
      </AssistantProvider>
    </CozyTheme>
  )
}

export default AssistantDialogWithProviders
