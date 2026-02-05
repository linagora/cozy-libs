import { useMessagePartText } from '@assistant-ui/react'
import React from 'react'

import Markdown from 'cozy-ui/transpiled/react/Markdown'

const MarkdownText = () => {
  const textPart = useMessagePartText()

  if (!textPart?.text) return null

  return <Markdown content={textPart.text} />
}

export default MarkdownText
