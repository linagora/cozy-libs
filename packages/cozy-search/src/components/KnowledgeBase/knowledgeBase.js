import { Q } from 'cozy-client'

import { EMAIL_DOCTYPE, FILES_DOCTYPE } from '../queries'

const ASSISTANTS_DOCTYPE = 'io.cozy.ai.chat.assistants'

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
 */
export const saveKnowledgeBase = async (
  client,
  assistantId,
  knowledgeBaseOrUpdater
) => {
  const { data: assistant } = await client.query(
    Q(ASSISTANTS_DOCTYPE).getById(assistantId)
  )
  const knowledgeBase =
    typeof knowledgeBaseOrUpdater === 'function'
      ? knowledgeBaseOrUpdater(assistant?.knowledgeBase)
      : knowledgeBaseOrUpdater
  await client.save({ ...assistant, knowledgeBase })
}
