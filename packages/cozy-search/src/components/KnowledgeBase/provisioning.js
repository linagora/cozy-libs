import { models } from 'cozy-client'

import {
  getKnowledgeBaseDirId,
  isRootDirId,
  saveKnowledgeBase
} from './knowledgeBase'
import { getSelectedProviderById } from '../CreateAssistantSteps/helpers'
import {
  ACCOUNTS_DOCTYPE,
  buildAssistantByIdQuery,
  buildProviderAccountsQuery,
  FILES_DOCTYPE
} from '../queries'

const ASSISTANTS_DOCTYPE = 'io.cozy.ai.chat.assistants'
const APPS_DOCTYPE = 'io.cozy.apps'
const OPENRAG_PROVIDER_ID = 'openrag'
// Some magic folders nest: io.cozy.apps/administrative/papers is one id.
const MAGIC_FOLDER_ID = /^io\.cozy\.apps\/.+$/

/**
 * Derives the CouchDB _id of a provisioned assistant from its name: only
 * [a-z0-9-] survive, so the id is URL-safe and never starts with "_".
 */
export const assistantIdFromName = name =>
  String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const isMagicFolderId = dirId =>
  MAGIC_FOLDER_ID.test(String(dirId || ''))

const isNotFound = error => error?.status === 404

const isLiveDirectory = file =>
  !!file &&
  file.type === 'directory' &&
  !file.trashed &&
  !(file.path || '').startsWith('/.cozy_trash')

const warn = (...args) => {
  // eslint-disable-next-line no-console
  console.warn('cozy-search provisioning:', ...args)
}

/**
 * Resolves the knowledge base folder of a flag entry. dirId wins over
 * dirName and never falls back to it. Returns the dir id, or null.
 */
export const resolveProvisionedFolder = async (client, { dirId, dirName }) => {
  if (dirId) {
    if (isRootDirId(dirId)) return dirId
    if (isMagicFolderId(dirId)) {
      const folder = await models.folder.getReferencedFolder(client, {
        _type: APPS_DOCTYPE,
        _id: dirId
      })
      if (!folder) warn(`magic folder ${dirId} has no directory yet`)
      return folder ? folder._id : null
    }
    try {
      const { data: file } = await client
        .collection(FILES_DOCTYPE)
        .statById(dirId)
      if (isLiveDirectory(file)) return file._id
      warn(`folder ${dirId} is not a live directory`)
      return null
    } catch (error) {
      if (isNotFound(error)) {
        warn(`folder ${dirId} does not exist`)
        return null
      }
      throw error
    }
  }
  return client.collection(FILES_DOCTYPE).ensureDirectoryExists(`/${dirName}`)
}

/**
 * Returns the instance's openrag provider account, creating it when there
 * is none. Same shape as cozy-client's buildProviderAccount.
 */
export const findOrCreateOpenragAccount = async client => {
  const { definition, options } =
    buildProviderAccountsQuery(OPENRAG_PROVIDER_ID)
  const { data: accounts } = await client.query(definition(), options)
  if (accounts?.length > 0) return accounts[0]

  const provider = getSelectedProviderById(OPENRAG_PROVIDER_ID)
  const { data: account } = await client.save({
    _type: ACCOUNTS_DOCTYPE,
    account_type: OPENRAG_PROVIDER_ID,
    identifier: 'accountName',
    auth: { accountName: provider.name },
    data: { model: provider.models[0] }
  })
  return account
}

const getAssistant = async (client, id) => {
  try {
    const { definition, options } = buildAssistantByIdQuery(id)
    const { data } = await client.query(definition(), { as: options.as })
    return data || null
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

const createProvisionedAssistant = async (client, id, entry, dirId) => {
  const account = await findOrCreateOpenragAccount(client)
  try {
    await client.save({
      _type: ASSISTANTS_DOCTYPE,
      _id: id,
      name: entry.name,
      prompt: entry.prompt || '',
      icon: entry.icon || null,
      relationships: {
        provider: {
          data: {
            _type: ACCOUNTS_DOCTYPE,
            _id: account._id,
            metadata: { providerId: OPENRAG_PROVIDER_ID }
          }
        }
      }
    })
  } catch (error) {
    // Created concurrently by another session: it is ours to ensure now.
    if (error?.status === 409) return false
    throw error
  }
  await saveKnowledgeBase(client, id, [{ doctype: FILES_DOCTYPE, dirId }])
  return true
}

const validate = entry => {
  const id = assistantIdFromName(entry?.name)
  if (!id) return { id: '', reason: 'invalid name' }
  if (!entry.dirId && !entry.dirName) {
    return { id, reason: 'dirId or dirName is required' }
  }
  return { id }
}

/**
 * Provisions the assistants described by the rag.assistants.autoprovision
 * flag. Idempotent: an existing assistant is left alone, or gets the flag's
 * folder back when it lost it or fell back to the root.
 * @param {import('cozy-client').CozyClient} client - The cozy client.
 * @param {Array<{name: string, dirName?: string, dirId?: string, prompt?: string, icon?: string|null}>} configs - The flag entries.
 * @returns {Promise<{created: string[], ensured: string[], skipped: {id: string, reason: string}[]}>} What was created, ensured and skipped.
 */
export const ensureProvisionedAssistants = async (client, configs) => {
  const result = { created: [], ensured: [], skipped: [] }
  if (!Array.isArray(configs) || configs.length === 0) return result

  for (const entry of configs) {
    const { id, reason } = validate(entry)
    if (reason) {
      result.skipped.push({ id, reason })
      continue
    }
    try {
      let assistant = await getAssistant(client, id)
      let created = false
      if (!assistant) {
        const dirId = await resolveProvisionedFolder(client, entry)
        if (!dirId) {
          result.skipped.push({ id, reason: 'folder could not be resolved' })
          continue
        }
        created = await createProvisionedAssistant(client, id, entry, dirId)
        assistant = created
          ? { _id: id, knowledgeBase: [{ doctype: FILES_DOCTYPE, dirId }] }
          : await getAssistant(client, id)
      }

      if (created) {
        // saveKnowledgeBase already saved the knowledge base.
        result.created.push(id)
        continue
      }
      // The flag wins for provisioned assistants: resolve it first so we
      // can tell a deliberate root fallback from one the flag disagrees
      // with.
      const wanted = await resolveProvisionedFolder(client, entry)
      if (!wanted) {
        result.skipped.push({ id, reason: 'folder could not be resolved' })
        continue
      }
      const current = getKnowledgeBaseDirId(assistant)
      if (current === null || (isRootDirId(current) && !isRootDirId(wanted))) {
        // Self-heal: an earlier run saved the assistant but not its
        // knowledge base, the user detached the folder, or it fell back to
        // the root while the flag still names a folder. The flag entry
        // still describes it, so re-attach it.
        await saveKnowledgeBase(client, id, [
          { doctype: FILES_DOCTYPE, dirId: wanted }
        ])
        result.ensured.push(id)
        continue
      }
      const live = await resolveProvisionedFolder(client, { dirId: current })
      if (!live) {
        result.skipped.push({
          id,
          reason: `folder ${current} is missing or trashed`
        })
        continue
      }
      result.ensured.push(id)
    } catch (error) {
      warn(`entry ${id} failed`, error)
      result.skipped.push({ id, reason: error?.message || String(error) })
    }
  }
  return result
}
