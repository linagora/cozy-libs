import { useEffect } from 'react'

import { useClient } from 'cozy-client'

import { ensureAssistantsSetup } from './autoprovision'

/**
 * Sets the flagged assistants and their RAG indexing up at the startup of
 * a host app, the first time only: see ensureAssistantsSetup.
 */
export const useAssistantsSetup = () => {
  const client = useClient()

  useEffect(() => {
    if (client) ensureAssistantsSetup(client)
  }, [client])
}
