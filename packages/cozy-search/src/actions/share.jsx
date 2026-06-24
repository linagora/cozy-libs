import { Share } from '@linagora/twake-icons'

import makeActionComponent from './makeActionComponent'

export const share = ({ t }) => {
  const label = t('assistant.sidebar.conversation.actions.share')

  return {
    name: 'share',
    icon: Share,
    label,
    Component: makeActionComponent(label, Share),
    action: () => {
      // TO DO: Add action to share due to this action does not exist yet in backend, we will implement it later
    }
  }
}
