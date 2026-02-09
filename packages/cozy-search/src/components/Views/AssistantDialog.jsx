import cx from 'classnames'
import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { FixedDialog } from 'cozy-ui/transpiled/react/CozyDialogs'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import AssistantProvider, { useAssistant } from '../AssistantProvider'
import CreateAssistantDialog from './CreateAssistantDialog'
import DeleteAssistantDialog from './DeleteAssistantDialog'
import EditAssistantDialog from './EditAssistantDialog'
import AssistantContainer from '../Assistant/AssistantContainer'
import styles from '../styles.styl'

const AssistantDialog = () => {
  const {
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
      disableGutters={true}
      componentsProps={{
        dialogTitle: { className: isMobile ? 'u-ph-0' : '' },
        dialogActions: { className: isMobile ? 'u-mh-half' : 'u-m-0' },
        divider: { className: 'u-dn' },
        dialogContent: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            padding: 0
          }
        }
      }}
      title=" "
      content={
        <div
          className={cx(
            'u-w-100 u-flex u-flex-column u-ov-hidden',
            styles['assistantWrapper']
          )}
        >
          <AssistantContainer />
        </div>
      }
      actions={
        <div className="u-w-100">
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
