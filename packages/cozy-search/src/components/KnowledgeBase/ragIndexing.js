import { withRootFolderIfMissing } from './knowledgeBase'
import {
  ASSISTANTS_DOCTYPE,
  buildAllAssistantsQuery,
  FILES_DOCTYPE
} from '../queries'

export const RAG_INDEX_WORKER = 'rag-index'
export const RAG_INDEX_FILES_DEBOUNCE = '30s'
const TRIGGERS_DOCTYPE = 'io.cozy.triggers'

const warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn('cozy-search rag indexing:', ...args)
}

/**
 * The two rag-index triggers of an instance: one on the files (debounced,
 * they change often), one on the assistants (a knowledge base change must
 * be seen at once). Both carry the same message.
 */
export const makeRagIndexTriggerAttributes = doctype => ({
  type: '@event',
  arguments: doctype,
  ...(doctype === FILES_DOCTYPE ? { debounce: RAG_INDEX_FILES_DEBOUNCE } : {}),
  worker: RAG_INDEX_WORKER,
  message: { doctype: FILES_DOCTYPE }
})

/**
 * Lists the rag-index triggers of the instance by kind.
 * @returns {Promise<{ files: object|null, assistants: object|null }>}
 */
export const findRagIndexTriggers = async client => {
  const { data: triggers } = await client
    .collection(TRIGGERS_DOCTYPE)
    .find({ worker: RAG_INDEX_WORKER })
  const found = { files: null, assistants: null }
  for (const trigger of triggers || []) {
    if (trigger.type !== '@event') continue
    if (trigger.arguments === FILES_DOCTYPE && !found.files) {
      found.files = trigger
    } else if (trigger.arguments === ASSISTANTS_DOCTYPE && !found.assistants) {
      found.assistants = trigger
    }
  }
  return found
}

/**
 * Gives the root folder to every assistant without a knowledge base
 * folder (the rule is permanent: an assistant always has one). A conflict
 * on one assistant means another session did it: skipped.
 * @returns {Promise<string[]>} The ids of the migrated assistants.
 */
export const migrateAssistantsWithoutFolder = async client => {
  const migrated = []
  const { definition, options } = buildAllAssistantsQuery()
  const assistants = await client.queryAll(definition(), options)
  for (const assistant of assistants) {
    const knowledgeBase = withRootFolderIfMissing(assistant.knowledgeBase)
    if (knowledgeBase === assistant.knowledgeBase) continue
    try {
      await client.save({ ...assistant, knowledgeBase })
      migrated.push(assistant._id)
    } catch (error) {
      if (error?.status !== 409) throw error
    }
  }
  return migrated
}

const ensureTriggers = async client => {
  const created = []
  const { files, assistants } = await findRagIndexTriggers(client)
  const triggers = client.collection(TRIGGERS_DOCTYPE)
  if (!assistants) {
    await triggers.create(makeRagIndexTriggerAttributes(ASSISTANTS_DOCTYPE))
    created.push(ASSISTANTS_DOCTYPE)
  }
  if (!files) {
    const { data: trigger } = await triggers.create(
      makeRagIndexTriggerAttributes(FILES_DOCTYPE)
    )
    // The first run: the worker creates the workspaces and indexes.
    await triggers.launch(trigger)
    created.push(FILES_DOCTYPE)
  }
  return created
}

/**
 * Makes the instance ready for the assistants-driven indexing: the files
 * and assistants triggers exist (the files one is launched when created),
 * and every assistant has a knowledge base folder. Idempotent and never throws: an app calls it once
 * per session at startup. On a stack that still reserves the worker the
 * trigger creation answers 403: logged, the assistants keep working with
 * the stack's legacy indexing.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @returns {Promise<{triggers: string[], migrated: string[], errors: Error[]}>}
 * The `arguments` of the triggers created, the ids of the migrated
 * assistants, and the failures.
 */
export const setupRagIndexing = async client => {
  const result = { triggers: [], migrated: [], errors: [] }
  try {
    result.triggers = await ensureTriggers(client)
  } catch (error) {
    warn('cannot set up the rag-index triggers', error)
    result.errors.push(error)
  }
  try {
    result.migrated = await migrateAssistantsWithoutFolder(client)
  } catch (error) {
    warn('cannot migrate the assistants without folder', error)
    result.errors.push(error)
  }
  return result
}
