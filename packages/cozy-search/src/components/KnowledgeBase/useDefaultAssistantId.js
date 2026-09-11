import { useQuery } from 'cozy-client'

import { getDefaultProvisionedAssistantId } from './provisioning'
import { buildAssistantsQuery } from '../queries'

/**
 * The assistant new conversations start on: the flagged default of the
 * autoprovision flag, once its document is known to exist. Null while the
 * list loads, when nothing is configured, or when the document is missing
 * (an id the stack cannot resolve would fail every message).
 * @returns {string|null}
 */
export const useDefaultAssistantId = () => {
  const defaultId = getDefaultProvisionedAssistantId()
  const assistantsQuery = buildAssistantsQuery()
  const { data: assistants, fetchStatus } =
    useQuery(assistantsQuery.definition, {
      ...assistantsQuery.options,
      enabled: !!defaultId
    }) || {}
  if (!defaultId || fetchStatus !== 'loaded') return null
  return (assistants || []).some(a => a._id === defaultId) ? defaultId : null
}
