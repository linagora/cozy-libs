import ShareIcon from 'cozy-ui/transpiled/react/Icons/Share'

import makeActionComponent from './makeActionComponent'

export const share = ({ t }) => {
  const label = t('assistant.sidebar.conversation.actions.share')

  return {
    name: 'share',
    icon: ShareIcon,
    label,
    Component: makeActionComponent(label, ShareIcon),
    action: () => {
      // TO DO: Add action to share due to this action does not exist yet in backend, we will implement it later
    }
  }
}
