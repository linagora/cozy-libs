import React from 'react'

const strokeProps = {
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

export function IconCheckAnimated(props) {
  return (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M1 11L4 14L15 3" {...strokeProps} />
    </svg>
  )
}

export function IconCrossAnimated(props) {
  return (
    <svg viewBox="0 0 16 16" {...props}>
      <path d="M2 2L14 14" {...strokeProps} />
      <path d="M14 2L2 14" {...strokeProps} />
    </svg>
  )
}
