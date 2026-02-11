import {
  AttachmentAdapter,
  PendingAttachment,
  CompleteAttachment,
  Attachment
} from '@assistant-ui/react'

export class CozyAttachmentAdapter implements AttachmentAdapter {
  accept = '*'

  async add({ file }: { file: File }): Promise<PendingAttachment> {
    return {
      id: Math.random().toString(36).slice(2),
      type: 'file',
      name: file.name,
      contentType: file.type,
      file,
      status: { type: 'requires-action', reason: 'composer-send' }
    }
  }

  async remove(attachment: Attachment): Promise<void> {
    // No cleanup needed
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    return {
      ...attachment,
      status: { type: 'complete' },
      content: [
        {
          type: 'text',
          text: `[File: ${attachment.name}]`
        }
      ]
    }
  }
}
