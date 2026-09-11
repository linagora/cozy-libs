import { useCallback } from 'react'

import { useClient, useQuery } from 'cozy-client'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n } from 'twake-i18n'

import {
  getKnowledgeBaseDirId,
  hasEmailKnowledgeBase,
  isRootDirId,
  makeKnowledgeBaseEntry,
  saveKnowledgeBase,
  withKnowledgeBaseEntry
} from './knowledgeBase'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'
import { buildAssistantByIdQuery, buildFileByIdQuery } from '../queries'

/**
 * Resolves the selected assistant's knowledge-base sources: the Drive folder
 * (live from io.cozy.files — renames reflected, deletion detected) and the
 * all-or-nothing email source.
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

  const dirId = getKnowledgeBaseDirId(assistant)
  const fileQuery = buildFileByIdQuery(dirId)
  const { data: folder, fetchStatus } = useQuery(
    fileQuery.definition,
    fileQuery.options
  )

  const hasEmail = hasEmailKnowledgeBase(assistant)

  // The folder is gone (or unreadable): its knowledge base cannot be used.
  const isUnavailable =
    !!dirId &&
    (fetchStatus === 'failed' ||
      !!folder?.trashed ||
      !!folder?.path?.startsWith('/.cozy_trash'))

  const setKnowledgeBaseFolder = useCallback(
    async pickedFolder => {
      if (!realAssistantId || !pickedFolder) return
      try {
        await saveKnowledgeBase(client, realAssistantId, kb =>
          withKnowledgeBaseEntry(kb, makeKnowledgeBaseEntry(pickedFolder))
        )
      } catch (_error) {
        showAlert({ message: t('assistant.default_error'), severity: 'error' })
      }
    },
    [client, realAssistantId, showAlert, t]
  )

  const isRoot = isRootDirId(dirId)

  return {
    dirId,
    folder: folder ?? null,
    isRoot,
    isUnavailable,
    setKnowledgeBaseFolder,
    isRealAssistant: !!realAssistantId,
    hasEmail
  }
}
