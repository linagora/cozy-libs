import flag from 'cozy-flags'

import { AUTOPROVISION_FLAG, ensureProvisionedAssistants } from './provisioning'
import {
  createRagIndexTriggers,
  fetchAssistants,
  findRagIndexTriggers,
  migrateAssistantsWithoutFolder
} from './ragIndexing'

const warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn('cozy-search autoprovision:', ...args)
}

let pending = null
let setupPending = null

export const resetAutoprovisionForTests = () => {
  pending = null
  setupPending = null
}

/**
 * The entries of the autoprovision flag, or null when it lists nothing.
 * @returns {Array<object>|null}
 */
export const autoprovisionEntries = () => {
  const entries = flag(AUTOPROVISION_FLAG)
  return Array.isArray(entries) && entries.length > 0 ? entries : null
}

const run = async client => {
  const entries = autoprovisionEntries()
  if (!entries) return null
  const setup = { triggers: [], migrated: [], errors: [] }
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
  // Last: the triggers tell ensureAssistantsSetup that the setup completed,
  // and the launch of the files one indexes the folders just provisioned.
  try {
    setup.triggers = await createRagIndexTriggers(client)
  } catch (error) {
    warn('cannot set up the rag-index triggers', error)
    setup.errors.push(error)
  }
  return { setup, ...result }
}

/**
 * Gives a folder to the assistants that lack one, provisions the
 * assistants listed in the autoprovision flag, then sets up the rag-index
 * triggers. Runs once per session: every call shares the first one's
 * promise. Never rejects.
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

/**
 * The startup entry point of a host app: one request when the instance is
 * already set up. The rag-index triggers are created last by
 * autoprovisionAssistants, so finding both means an earlier session went
 * through; anything changed since is caught when the assistant opens.
 * Runs once per session, never rejects.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @returns {Promise<null|object>} Null when there was nothing to do, the
 * result of autoprovisionAssistants otherwise.
 */
export const ensureAssistantsSetup = client => {
  if (!setupPending) {
    setupPending = (async () => {
      if (!autoprovisionEntries()) return null
      const { files, assistants } = await findRagIndexTriggers(client)
      if (files && assistants) return null
      return autoprovisionAssistants(client)
    })().catch(error => {
      warn('cannot check the rag-index triggers', error)
      return null
    })
  }
  return setupPending
}
