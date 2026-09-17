import flag from 'cozy-flags'

import { AUTOPROVISION_FLAG, ensureProvisionedAssistants } from './provisioning'
import { setupRagIndexing } from './ragIndexing'

const warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn('cozy-search autoprovision:', ...args)
}

let pending = null

export const resetAutoprovisionForTests = () => {
  pending = null
}

const run = async client => {
  const entries = flag(AUTOPROVISION_FLAG)
  if (!Array.isArray(entries) || entries.length === 0) return null
  const setup = await setupRagIndexing(client)
  const result = await ensureProvisionedAssistants(client, entries)
  if (result.skipped.length > 0) {
    warn('skipped entries', result.skipped)
  }
  return { setup, ...result }
}

/**
 * Sets up the rag-index triggers, then provisions the assistants listed in
 * the autoprovision flag. Runs once per session: every call shares the
 * first one's promise, so the assistant UI and the host app's startup can
 * both trigger it without racing each other. Never rejects.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @returns {Promise<null|{setup: object, created: string[], ensured: string[], skipped: {id: string, reason: string}[]}>} Null when the flag lists nothing.
 */
export const autoprovisionAssistants = client => {
  if (!pending) {
    pending = run(client).catch(error => {
      warn('failed', error)
      return null
    })
  }
  return pending
}
