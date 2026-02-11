import React from 'react'
import { AttachmentPrimitive } from '@assistant-ui/react'

export const RemoveButton = () => (
  <AttachmentPrimitive.Remove className="u-pos-absolute u-t-0 u-r-0 u-p-0-half u-bg-white u-bd-rad-circle u-cursor-pointer u-z-1 u-sh-s">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </AttachmentPrimitive.Remove>
)
