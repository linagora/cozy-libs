import TrashIcon from 'cozy-ui/transpiled/react/Icons/Trash'

import makeActionComponent from './makeActionComponent'

export const remove = ({ t, onDelete }) => {
  const label = t('assistant.sidebar.conversation.actions.delete')

  return {
    name: 'delete',
    icon: TrashIcon,
    label,
    Component: makeActionComponent(label, TrashIcon, { className: 'u-error' }),
    action: () => {
      onDelete()
    }
  }
}
