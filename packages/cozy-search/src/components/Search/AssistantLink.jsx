import { useNavigate, useLocation } from 'react-router-dom'

import { isAssistantEnabled, makeConversationId } from '../helpers'

const AssistantLink = ({ children }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const openAssistant = () => {
    if (!isAssistantEnabled()) return

    const conversationId = makeConversationId()
    navigate(`assistant/${conversationId}?returnPath=${pathname}`)
  }

  return children({ openAssistant })
}

export default AssistantLink
