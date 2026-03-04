import { useLocation, useNavigate } from 'react-router-dom'

import { useAssistant } from '../components/AssistantProvider'
import { makeConversationId } from '../components/helpers'

const useConversation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setIsOpenSearchConversation } = useAssistant()

  const goToConversation = conversationId => {
    // Extract base path safely by identifying the start of '/assistant' if it exists.
    const match = location.pathname.match(/^(.*?)(\/assistant(\/|$).*|$)/)
    const basePath = (match?.[1] || location.pathname).replace(/\/$/, '')
    const newPathname = `${basePath}/assistant/${conversationId}`

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
