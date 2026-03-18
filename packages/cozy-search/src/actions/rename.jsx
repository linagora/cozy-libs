import RenameIcon from 'cozy-ui/transpiled/react/Icons/Rename'

import makeActionComponent from './makeActionComponent'

export const rename = ({ t, onRename }) => {
  const label = t('assistant.sidebar.conversation.actions.rename')

  return {
    name: 'rename',
    icon: RenameIcon,
    label,
    Component: makeActionComponent(label, RenameIcon),
    action: () => {
      onRename()
    }
  }
}
