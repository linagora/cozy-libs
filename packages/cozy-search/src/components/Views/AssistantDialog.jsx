import React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import flag from 'cozy-flags'
import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import AssistantProvider, { useAssistant } from '../AssistantProvider'
import CreateAssistantDialog from './CreateAssistantDialog'
import DeleteAssistantDialog from './DeleteAssistantDialog'
import EditAssistantDialog from './EditAssistantDialog'
import AssistantSelection from '../Conversations/AssistantSelection'
import Conversation from '../Conversations/Conversation'
import ConversationBar from '../Conversations/ConversationBar'

const AssistantDialog = () => {
  const {
    assistantState,
    isOpenCreateAssistant,
    setIsOpenCreateAssistant,
    isOpenEditAssistant,
    setIsOpenEditAssistant,
    isOpenDeleteAssistant,
    setIsOpenDeleteAssistant
  } = useAssistant()
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { conversationId } = useParams()

  const onClose = () => {
    try {
      const returnPath = searchParams.get('returnPath')
      if (returnPath) {
        navigate(returnPath)
      } else {
        navigate('..')
      }
    } catch {
      navigate('..')
    }
  }

  return (
    <FixedDialog
      open
      fullScreen
      size="full"
      componentsProps={{
        dialogTitle: { className: isMobile ? 'u-ph-0' : '' },
        dialogActions: { className: isMobile ? 'u-mh-half' : 'u-mb-2' },
        divider: { className: 'u-dn' }
      }}
      title={isMobile ? ' ' : ' '}
      content={<Conversation id={conversationId} />}
      actions={
        <div className="u-w-100">
          <ConversationBar assistantStatus={assistantState.status} />
          {flag('cozy.create-assistant.enabled') && (
            <AssistantSelection className="u-w-100 u-maw-7 u-mh-auto u-mt-1" />
          )}

          {isOpenCreateAssistant && (
            <CreateAssistantDialog
              open={isOpenCreateAssistant}
              onClose={() => setIsOpenCreateAssistant(false)}
            />
          )}

          {isOpenEditAssistant && (
            <EditAssistantDialog
              open={isOpenEditAssistant}
              onClose={() => setIsOpenEditAssistant(false)}
            />
          )}

          {isOpenDeleteAssistant && (
            <DeleteAssistantDialog
              open={isOpenDeleteAssistant}
              onClose={() => setIsOpenDeleteAssistant(false)}
            />
          )}
        </div>
      }
      onClose={onClose}
    />
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
