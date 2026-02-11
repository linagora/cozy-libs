import React from 'react'
import { AttachmentPrimitive } from '@assistant-ui/react'
import { RemoveButton } from './RemoveButton'

export const DocumentPreview = () => {
  return (
    <AttachmentPrimitive.Root className="u-pos-relative u-flex u-ai-center u-gap-0-half u-p-0-half u-bd u-bd-rad-2 u-bg-pale-grey u-mr-0-half u-maw-10">
      <div className="u-flex u-ai-center u-jc-center u-w-2 u-h-2 u-bg-white u-bd-rad-1">
        <span role="img" aria-label="document">📄</span>
      </div>
      <div className="u-flex u-column u-flex-1 u-ov-hidden">
        <AttachmentPrimitive.Name className="u-fz-xs u-mv-0 u-ellipsis u-txt-nowrap" />
      </div>
      <RemoveButton />
    </AttachmentPrimitive.Root>
  )
}
