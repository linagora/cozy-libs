import React from 'react'

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
    <>
      <ConversationView />

      <CreateAssistantDialog
        open={isOpenCreateAssistant}
        onClose={closeCreateAssistantDialog}
      />
    </>
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
