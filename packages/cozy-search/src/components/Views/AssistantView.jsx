import cx from 'classnames'
import React from 'react'

import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import CozyTheme from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useExtendI18n } from 'twake-i18n'

import AssistantProvider, { useAssistant } from '../AssistantProvider'
import CreateAssistantDialog from './CreateAssistantDialog'
import DeleteAssistantDialog from './DeleteAssistantDialog'
import EditAssistantDialog from './EditAssistantDialog'
import { locales } from '../../locales'
import AssistantContainer from '../Assistant/AssistantContainer'
import styles from '../styles.styl'

const AssistantView = () => {
  // The view is mounted by the app on its own route, without the search
  // bar that otherwise registers the translations of this package.
  useExtendI18n(locales)
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
          'u-pb-1-t u-bxz': isMobile
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
