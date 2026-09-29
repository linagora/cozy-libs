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
let partialSetup = null

export const resetAutoprovisionForTests = () => {
  pending = null
  setupPending = null
  partialSetup = null
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
 * Whether the host app sets a flag entry up at startup, which starts the
 * indexing of its folder. `setupOnStartup` defaults to true.
 */
export const isSetupOnStartup = entry => entry?.setupOnStartup !== false

const run = async (client, entries) => {
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

const provision = (client, entries) =>
  run(client, entries).catch(error => {
    warn('failed', error)
    return null
  })

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
    // The startup may be setting its entries up: wait for it,
    // the two must not create the triggers at the same time.
    pending = Promise.resolve(partialSetup).then(() =>
      provision(client, autoprovisionEntries())
    )
  }
  return pending
}

/**
 * The startup entry point of a host app: one request when the instance is
 * already set up. The rag-index triggers are created last by
 * autoprovisionAssistants, so finding both means an earlier session went
 * through; anything changed since is caught when the assistant opens.
 * Only the entries with `setupOnStartup` (true by default) are set up here:
 * without any, the app does nothing at startup, and the other entries
 * wait for the assistant to open. Runs once per session, never rejects.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @returns {Promise<null|object>} Null when there was nothing to do, the
 * result of autoprovisionAssistants otherwise.
 */
export const ensureAssistantsSetup = client => {
  if (!setupPending) {
    setupPending = (async () => {
      const entries = autoprovisionEntries()
      const startupEntries = entries ? entries.filter(isSetupOnStartup) : []
      if (startupEntries.length === 0) return null
      const { files, assistants } = await findRagIndexTriggers(client)
      if (files && assistants) return null
      if (pending || startupEntries.length === entries.length) {
        return autoprovisionAssistants(client)
      }
      partialSetup = provision(client, startupEntries)
      return partialSetup
    })().catch(error => {
      warn('cannot check the rag-index triggers', error)
      return null
    })
  }
  return setupPending
}
