import cx from 'classnames'
import React from 'react'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'

import AssistantProvider, { useAssistant } from '../AssistantProvider'
import CreateAssistantDialog from './CreateAssistantDialog'
import DeleteAssistantDialog from './DeleteAssistantDialog'
import EditAssistantDialog from './EditAssistantDialog'
import AssistantContainer from '../Assistant/AssistantContainer'
import styles from '../styles.styl'

const AssistantView = () => {
  const {
    isOpenCreateAssistant,
    setIsOpenCreateAssistant,
    isOpenEditAssistant,
    setIsOpenEditAssistant,
    isOpenDeleteAssistant,
    setIsOpenDeleteAssistant
  } = useAssistant()
  const { isMobile } = useBreakpoints()

  return (
    <div
      className={cx(
        'u-w-100 u-flex u-flex-column u-ov-hidden',
        styles['assistantWrapper'],
        {
          'u-ph-1-t u-pb-1-t u-bxz': isMobile
        }
      )}
    >
      <AssistantContainer />

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
    </div>
  )
}

const AssistantViewWithProviders = () => {
  return (
    <CozyTheme variant="normal">
      <AssistantProvider>
        <AssistantView />
      </AssistantProvider>
    </CozyTheme>
  )
}

export default AssistantViewWithProviders
