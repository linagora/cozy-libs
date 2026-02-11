import React from 'react'
import { AttachmentPrimitive } from '@assistant-ui/react'
import { RemoveButton } from './RemoveButton'

export const ImagePreview = () => {
  return (
    <AttachmentPrimitive.Root className="u-pos-relative u-w-4 u-h-4 u-bd-rad-2 u-ov-hidden u-bd u-mr-0-half">
      <AttachmentPrimitive.unstable_Thumb className="u-w-100 u-h-100 u-obj-cover" />
      <RemoveButton />
    </AttachmentPrimitive.Root>
  )
}
