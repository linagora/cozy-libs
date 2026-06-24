import { Trash } from '@linagora/twake-icons'

import makeActionComponent from './makeActionComponent'

export const remove = ({ t, onDelete }) => {
  const label = t('assistant.sidebar.conversation.actions.delete')

  return {
    name: 'delete',
    icon: Trash,
    label,
    Component: makeActionComponent(label, Trash, { className: 'u-error' }),
    action: () => {
      onDelete()
    }
  }
}
