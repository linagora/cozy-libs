import { useCallback } from 'react'

import { useClient, useQuery } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import { getKnowledgeBaseFolderId, saveKnowledgeBase } from './knowledgeBase'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantByIdQuery, buildFileByIdQuery } from '../queries'

/**
 * Resolves the selected assistant's knowledge-base folder, live from
 * io.cozy.files (renames in Drive are reflected; deletion is detected).
 */
export const useSelectedAssistantKnowledgeBase = () => {
  const client = useClient()
  const { t } = useI18n()
  const { showAlert } = useAlert()
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

  const removeKnowledgeBase = useCallback(async () => {
    if (!realAssistantId) return
    try {
      await saveKnowledgeBase(client, realAssistantId, [])
    } catch {
      showAlert({ message: t('assistant.default_error'), severity: 'error' })
    }
  }, [client, realAssistantId, showAlert, t])

  return {
    folderId,
    folder: folder ?? null,
    isUnavailable:
      !!folderId &&
      (fetchStatus === 'failed' ||
        !!folder?.trashed ||
        !!folder?.path?.startsWith('/.cozy_trash')),
    removeKnowledgeBase
  }
}
