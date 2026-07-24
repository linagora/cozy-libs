import flag from 'cozy-flags'

import { isAttachmentsBlocked } from './attachments'
import { useAssistant } from '../AssistantProvider'
import { DEFAULT_ASSISTANT } from '../constants'

/**
 * Single gating condition for the default assistant's Drive restriction:
 * the guard and the attachmentIDs wiring must apply exactly when the
 * DriveSourceChip is offered (default assistant + feature flag), or an
 * orphaned selection could block sending with no visible UI to clear it.
 */
export const useAttachmentsGate = conversationId => {
  const { selectedAssistantId, attachmentsSelections, attachmentsResolutions } =
    useAssistant()

  const isGated =
    !!flag('cozy.assistant.attachments.enabled') &&
    selectedAssistantId === DEFAULT_ASSISTANT._id &&
    !!conversationId

  const selection = isGated ? attachmentsSelections[conversationId] : undefined
  const resolution = isGated
    ? attachmentsResolutions[conversationId]
    : undefined

  return {
    attachmentIds:
      selection && selection.length > 0 ? resolution?.attachmentIds : undefined,
    attachmentsBlocked: isAttachmentsBlocked(selection, resolution)
  }
}
