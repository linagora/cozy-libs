import flag from 'cozy-flags'

import { AUTOPROVISION_FLAG, ensureProvisionedAssistants } from './provisioning'
import {
  createRagIndexTriggers,
  fetchAssistants,
  migrateAssistantsWithoutFolder
} from './ragIndexing'

const warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn('cozy-search autoprovision:', ...args)
}

let triggersPending = null
let pending = null

export const resetAutoprovisionForTests = () => {
  triggersPending = null
  pending = null
}

/**
 * The entries of the autoprovision flag, or null when it lists nothing.
 * @returns {Array<object>|null}
 */
export const autoprovisionEntries = () => {
  const entries = flag(AUTOPROVISION_FLAG)
  return Array.isArray(entries) && entries.length > 0 ? entries : null
}

/**
 * Makes sure the instance has its rag-index triggers, so the files of the
 * knowledge base folders get indexed as they change. Runs once per session
 * and never rejects: a host app can call it at startup, it costs a single
 * request when the triggers already exist.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @returns {Promise<{triggers: string[], error: Error|null}>} The
 * `arguments` of the triggers created, and the failure if any.
 */
export const ensureRagIndexTriggers = client => {
  if (!triggersPending) {
    triggersPending = createRagIndexTriggers(client).then(
      triggers => ({ triggers, error: null }),
      error => {
        warn('cannot set up the rag-index triggers', error)
        return { triggers: [], error }
      }
    )
  }
  return triggersPending
}

const run = async client => {
  const entries = autoprovisionEntries()
  if (!entries) return null
  const setup = { triggers: [], migrated: [], errors: [] }
  const { triggers, error } = await ensureRagIndexTriggers(client)
  setup.triggers = triggers
  if (error) setup.errors.push(error)
  let assistants = null
  try {
    assistants = await fetchAssistants(client)
    setup.migrated = await migrateAssistantsWithoutFolder(client, assistants)
  } catch (error) {
    warn('cannot migrate the assistants without folder', error)
    setup.errors.push(error)
  }
  const result = await ensureProvisionedAssistants(client, entries, {
    assistants
  })
  if (result.skipped.length > 0) {
    warn('skipped entries', result.skipped)
  }
  return { setup, ...result }
}

/**
 * Sets up the rag-index triggers, gives a folder to the assistants that
 * lack one, then provisions the assistants listed in the autoprovision
 * flag. Runs once per session: every call shares the first one's promise,
 * and the triggers step is shared with ensureRagIndexTriggers, so a host
 * app that ensured them at startup does not pay for them twice. Never
 * rejects.
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
