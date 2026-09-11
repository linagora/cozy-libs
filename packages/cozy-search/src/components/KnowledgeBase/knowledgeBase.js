import {
  buildAssistantByIdQuery,
  EMAIL_DOCTYPE,
  FILES_DOCTYPE
} from '../queries'

/** The root folder of the instance: the assistant covers the whole Drive. */
export const ROOT_DIR_ID = 'io.cozy.files.root-dir'

export const isRootDirId = dirId => dirId === ROOT_DIR_ID

export const makeRootKnowledgeBaseEntry = () => ({
  doctype: FILES_DOCTYPE,
  dirId: ROOT_DIR_ID
})

const hasFolderEntry = knowledgeBase =>
  (knowledgeBase || []).some(
    entry => entry.doctype === FILES_DOCTYPE && !!entry.dirId
  )

/**
 * An assistant always has a knowledge base folder: without one, it covers
 * the whole Drive. Appends the root entry when no folder entry exists;
 * returns the very same array otherwise.
 */
export const withRootFolderIfMissing = (knowledgeBase = []) =>
  hasFolderEntry(knowledgeBase)
    ? knowledgeBase
    : [...knowledgeBase, makeRootKnowledgeBaseEntry()]

export const makeKnowledgeBaseEntry = pickedFolder => ({
  doctype: FILES_DOCTYPE,
  dirId: pickedFolder.id
})

export const makeEmailKnowledgeBaseEntry = () => ({ doctype: EMAIL_DOCTYPE })

export const hasEmailKnowledgeBase = assistant =>
  !!assistant?.knowledgeBase?.some(entry => entry.doctype === EMAIL_DOCTYPE)

/** Adds/replaces the entry for its doctype, preserving other sources. */
export const withKnowledgeBaseEntry = (knowledgeBase = [], entry) => [
  ...knowledgeBase.filter(e => e.doctype !== entry.doctype),
  entry
]

export const withoutKnowledgeBaseDoctype = (knowledgeBase = [], doctype) =>
  knowledgeBase.filter(e => e.doctype !== doctype)

export const getKnowledgeBaseDirId = assistant =>
  assistant?.knowledgeBase?.find(entry => entry.doctype === FILES_DOCTYPE)
    ?.dirId ?? null

/**
 * Saves the knowledgeBase attribute on an assistant document.
 *
 * `knowledgeBaseOrUpdater` is either the new knowledgeBase array (replaces
 * it wholesale — used when a caller deliberately owns the full array, e.g.
 * the edit dialog) or an updater function `(knowledgeBase) => knowledgeBase`
 * applied to the freshly fetched doc's knowledgeBase. Computing the update
 * from the fresh doc rather than a value the caller may have cached avoids
 * dropping concurrent changes (stale-read race).
 *
 * The saved knowledge base always has a folder entry (the root when none
 * was chosen): the stack's rag-index worker reads the assistants to know
 * what to index, there is nothing else to do here.
 */
export const saveKnowledgeBase = async (
  client,
  assistantId,
  knowledgeBaseOrUpdater
) => {
  const { definition, options } = buildAssistantByIdQuery(assistantId)
  const { data: assistant } = await client.query(definition(), {
    as: options.as
  })
  const knowledgeBase =
    typeof knowledgeBaseOrUpdater === 'function'
      ? knowledgeBaseOrUpdater(assistant?.knowledgeBase)
      : knowledgeBaseOrUpdater
  await client.save({
    ...assistant,
    knowledgeBase: withRootFolderIfMissing(knowledgeBase)
  })
}
