import { Q } from 'cozy-client'

import { FILES_DOCTYPE } from '../queries'

const ASSISTANTS_DOCTYPE = 'io.cozy.ai.chat.assistants'

export const makeKnowledgeBaseEntry = pickedFolder => ({
  doctype: FILES_DOCTYPE,
  folderId: pickedFolder.id
})

export const getKnowledgeBaseFolderId = assistant =>
  assistant?.knowledgeBase?.find(entry => entry.doctype === FILES_DOCTYPE)
    ?.folderId ?? null

/**
 * Saves the knowledgeBase attribute on an assistant document.
 *
 * cozy-client's createAssistant/editAssistant build the saved doc from a
 * fixed field list, so knowledgeBase must be saved in a follow-up write on
 * the freshly fetched doc (fresh _rev).
 */
export const saveKnowledgeBase = async (client, assistantId, knowledgeBase) => {
  const { data: assistant } = await client.query(
    Q(ASSISTANTS_DOCTYPE).getById(assistantId)
  )
  await client.save({ ...assistant, knowledgeBase })
}
