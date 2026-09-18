import { useEffect } from 'react'

import { useClient } from 'cozy-client'

import { autoprovisionEntries, ensureRagIndexTriggers } from './autoprovision'

/**
 * Ensures the rag-index triggers at startup, when the autoprovision flag
 * lists assistants: the knowledge base folders are then indexed as they
 * change, before the assistant is ever opened. The assistants themselves
 * are provisioned when the assistant opens.
 */
export const useRagIndexTriggers = () => {
  const client = useClient()

  useEffect(() => {
    if (client && autoprovisionEntries()) ensureRagIndexTriggers(client)
  }, [client])
}
