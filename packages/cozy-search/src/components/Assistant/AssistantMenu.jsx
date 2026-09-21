import cx from 'classnames'
import React from 'react'

import { Icon, Plus } from '@linagora/twake-icons'
import { useQuery } from 'cozy-client'
import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import AssistantSelectionItem from './AssistantSelectionItem'
import styles from './styles.styl'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantsQuery } from '../queries'

/**
 * The assistants of the instance and the selected one (the default
 * assistant when the selected id matches none).
 */
export const useSelectedAssistant = () => {
  const { selectedAssistantId } = useAssistant()
  const assistantsQuery = buildAssistantsQuery()
  const assistants =
    useQuery(assistantsQuery.definition, assistantsQuery.options)?.data || []
  const selectedAssistant =
    assistants.find(assistant => assistant._id === selectedAssistantId) ||
    DEFAULT_ASSISTANT
  return { assistants, selectedAssistant }
}

/**
 * The menu picking the assistant: one item per assistant, the default
 * one, then "Create Agent". Anchored on `anchorRef`; `onSelect` is called
 * with the id of the picked assistant, after it has been selected.
 */
const AssistantMenu = ({ anchorRef, open, onClose, onSelect }) => {
  const { t } = useI18n()
  const {
    setIsOpenCreateAssistant,
    setAssistantIdInAction,
    setIsOpenDeleteAssistant,
    setIsOpenEditAssistant,
    setSelectedAssistantId
  } = useAssistant()
  const { assistants, selectedAssistant } = useSelectedAssistant()

  const handleSelect = assistantId => {
    setSelectedAssistantId(assistantId)
    if (onSelect) onSelect(assistantId)
  }

  const handleCreate = () => {
    setIsOpenCreateAssistant(true)
    onClose()
  }

  if (!open) return null

  return (
    <ActionsMenu
      open
      ref={anchorRef}
      onClose={onClose}
      actions={[]}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      {assistants.map(assistant => (
        <AssistantSelectionItem
          key={assistant._id}
          assistant={assistant}
          onClose={onClose}
          onSelect={() => handleSelect(assistant._id)}
          selectedAssistant={selectedAssistant}
          setIsOpenDeleteAssistant={setIsOpenDeleteAssistant}
          setAssistantIdInAction={setAssistantIdInAction}
          setIsOpenEditAssistant={setIsOpenEditAssistant}
        />
      ))}
      <AssistantSelectionItem
        assistant={DEFAULT_ASSISTANT}
        onClose={onClose}
        onSelect={() => handleSelect(DEFAULT_ASSISTANT._id)}
        selectedAssistant={selectedAssistant}
        disableActions={true}
      />
      <ActionsMenuItem
        onClick={handleCreate}
        className={cx(styles['menu-item'], styles['create-item'])}
      >
        <div className="u-flex u-flex-items-center">
          <div className="u-flex u-flex-justify-center u-w-1-half u-mr-half">
            <Icon icon={Plus} size={16} color="var(--primaryColor)" />
          </div>
          <Typography variant="body1" color="primary">
            {t('assistant_create.title')}
          </Typography>
        </div>
      </ActionsMenuItem>
    </ActionsMenu>
  )
}

export default AssistantMenu
