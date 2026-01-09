import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import CozyAssistantRuntimeProvider from '../CozyAssistantRuntimeProvider'
import CozyThread from '../Conversations/CozyThread'

const AssistantDialog = () => {
  const { isMobile } = useBreakpoints()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

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
        divider: { className: 'u-dn' },
        dialogContent: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            padding: 0,
            overflow: 'hidden' // Prevent double scrollbar - let viewport handle scroll
          }
        }
      }}
      title={isMobile ? ' ' : ' '}
      content={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          flexGrow: 1,
          minHeight: 0, // Allow flex child to shrink below content size
          overflow: 'hidden'
        }}>
          <CozyThread />
        </div>
      }
      onClose={onClose}
    />
  )
}

const AssistantDialogWithProviders = () => {
  return (
    <CozyTheme variant="normal">
      <CozyAssistantRuntimeProvider>
        <AssistantDialog />
      </CozyAssistantRuntimeProvider>
    </CozyTheme>
  )
}

export default AssistantDialogWithProviders
