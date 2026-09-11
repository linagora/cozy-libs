import { useQuery } from 'cozy-client'

import { getDefaultProvisionedAssistantId } from './provisioning'
import { buildAssistantByIdQuery } from '../queries'

/**
 * The assistant new conversations start on: the flagged default of the
 * autoprovision flag, once its document is known to exist. Undefined while
 * that is being checked; null when nothing is configured or when the
 * document is missing (an id the stack cannot resolve would fail every
 * message).
 * @returns {string|null|undefined}
 */
export const useDefaultAssistantId = () => {
  const defaultId = getDefaultProvisionedAssistantId()
  const { definition, options } = buildAssistantByIdQuery(defaultId)
  const { data: assistant, fetchStatus } = useQuery(definition, options) || {}
  if (!defaultId || fetchStatus === 'failed') return null
  if (fetchStatus !== 'loaded') return undefined
  return assistant?._id === defaultId ? defaultId : null
}
