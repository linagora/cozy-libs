import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAssistant } from '../components/AssistantProvider'
import { makeConversationId } from '../components/helpers'

const useConversation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setIsOpenSearchConversation } = useAssistant()

  // `useNavigate()` returns a new function whenever the location changes, and
  // `location` itself changes on every navigation. Keep both in refs so
  // `goToConversation` can stay referentially stable across renders. A stable
  // callback is required for `React.memo` on the conversation list items to
  // actually skip re-renders on every conversation switch.
  const navigateRef = useRef(navigate)
  const locationRef = useRef(location)
  useEffect(() => {
    navigateRef.current = navigate
    locationRef.current = location
  }, [navigate, location])

  const goToConversation = useCallback(
    conversationId => {
      const loc = locationRef.current
      // Extract base path safely by identifying the start of '/assistant' if it exists.
      const match = loc.pathname.match(/^(.*?)(\/assistant(\/|$).*|$)/)
      const basePath = (match?.[1] ?? loc.pathname).replace(/\/$/, '')
      const newPathname = `${basePath}/assistant/${conversationId}`

      setIsOpenSearchConversation(false)

      navigateRef.current({
        pathname: newPathname,
        search: loc.search,
        hash: loc.hash
      })
    },
    [setIsOpenSearchConversation]
  )

  const createNewConversation = useCallback(() => {
    goToConversation(makeConversationId())
  }, [goToConversation])

  return {
    goToConversation,
    createNewConversation
  }
}

export default useConversation
