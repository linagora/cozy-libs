import React from 'react'

import Dialog from 'cozy-ui/transpiled/react/Dialog'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import AssistantProvider, { useAssistant } from '../AssistantProvider'
import ConversationView from './ConversationView'
import CreateAssistantDialog from './CreateAssistantDialog'

const AssistantDialog = () => {
  const { isOpenCreateAssistant, setIsOpenCreateAssistant } = useAssistant()

  const closeCreateAssistantDialog = () => {
    setIsOpenCreateAssistant(false)
  }

  return (
    <Dialog open fullScreen size="full" disableGutters>
      <ConversationView />

      <CreateAssistantDialog
        open={isOpenCreateAssistant}
        onClose={closeCreateAssistantDialog}
      />
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
