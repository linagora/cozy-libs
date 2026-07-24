export function useAttachmentsGate(conversationId: string): {
  attachmentIds: string[] | undefined
  attachmentsBlocked: boolean
}
