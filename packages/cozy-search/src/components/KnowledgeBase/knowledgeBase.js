import { Q } from 'cozy-client'

import { FILES_DOCTYPE } from '../queries'

const ASSISTANTS_DOCTYPE = 'io.cozy.ai.chat.assistants'

export const makeKnowledgeBaseEntry = pickedFolder => ({
  doctype: FILES_DOCTYPE,
  dirId: pickedFolder.id
})

export const getKnowledgeBaseDirId = assistant =>
  assistant?.knowledgeBase?.find(entry => entry.doctype === FILES_DOCTYPE)
    ?.dirId ?? null

/**
 * Saves the knowledgeBase attribute on an assistant document.
 */
export const saveKnowledgeBase = async (client, assistantId, knowledgeBase) => {
  const { data: assistant } = await client.query(
    Q(ASSISTANTS_DOCTYPE).getById(assistantId)
  )
  await client.save({ ...assistant, knowledgeBase })
}
