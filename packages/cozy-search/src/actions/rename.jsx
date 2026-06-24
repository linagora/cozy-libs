import { Rename } from '@linagora/twake-icons'

import makeActionComponent from './makeActionComponent'

export const rename = ({ t, onRename }) => {
  const label = t('assistant.sidebar.conversation.actions.rename')

  return {
    name: 'rename',
    icon: Rename,
    label,
    Component: makeActionComponent(label, Rename),
    action: () => {
      onRename()
    }
  }
}
