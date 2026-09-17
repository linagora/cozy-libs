import { useEffect } from 'react'

import { useClient } from 'cozy-client'

import { autoprovisionAssistants } from './autoprovision'

/**
 * Provisions the flagged assistants when the assistant UI opens, so an
 * instance gets them even if the host app did not do it at startup.
 */
export const useAssistantsAutoprovision = () => {
  const client = useClient()

  useEffect(() => {
    if (client) autoprovisionAssistants(client)
  }, [client])
}
