import { useQuery } from 'cozy-client'

import { getKnowledgeBaseFolderId } from './knowledgeBase'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantByIdQuery, buildFileByIdQuery } from '../queries'

/**
 * Resolves the selected assistant's knowledge-base folder, live from
 * io.cozy.files (renames in Drive are reflected; deletion is detected).
 */
export const useSelectedAssistantKnowledgeBase = () => {
  const { selectedAssistantId } = useAssistant()
  const realAssistantId =
    selectedAssistantId !== DEFAULT_ASSISTANT._id ? selectedAssistantId : null

  const assistantQuery = buildAssistantByIdQuery(realAssistantId)
  const { data: assistant } = useQuery(
    assistantQuery.definition,
    assistantQuery.options
  )

  const folderId = getKnowledgeBaseFolderId(assistant)
  const fileQuery = buildFileByIdQuery(folderId)
  const { data: folder, fetchStatus } = useQuery(
    fileQuery.definition,
    fileQuery.options
  )

  return {
    folderId,
    folder: folder ?? null,
    isUnavailable: !!folderId && (fetchStatus === 'failed' || !!folder?.trashed)
  }
}
