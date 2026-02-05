import { useLocation, useNavigate } from 'react-router-dom'

import { useAssistant } from '../components/AssistantProvider'
import { makeConversationId } from '../components/helpers'

const useConversation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setIsOpenSearchConversation } = useAssistant()

  const goToConversation = conversationId => {
    const parts = location.pathname.split('/')
    const assistantIndex = parts.findIndex(part => part === 'assistant')

    if (assistantIndex !== -1 && parts.length > assistantIndex + 1) {
      parts[assistantIndex + 1] = conversationId
    } else {
      parts.push('assistant', conversationId)
    }
    const newPathname = parts.join('/')

    setIsOpenSearchConversation(false)

    navigate({
      pathname: newPathname,
      search: location.search,
      hash: location.hash
    })
  }

  const createNewConversation = () => {
    const newConversationId = makeConversationId()
    goToConversation(newConversationId)
  }

  return {
    goToConversation,
    createNewConversation
  }
}

export default useConversation
