import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import SharingButton from './SharingButton'
import ShareModalProvider from '../providers/ShareModalProvider'
import ViewerProvider from '../providers/ViewerProvider'

jest.mock('cozy-sharing', () => ({
  ShareButton: ({ docId }) => <button>share {docId}</button>,
  ShareModal: () => null
}))

const file = {
  _id: 'file-1',
  id: 'file-1',
  name: 'Document'
}

const renderSharingButton = ({ componentsProps } = {}) =>
  render(
    <ViewerProvider file={file} componentsProps={componentsProps}>
      <ShareModalProvider>
        <SharingButton file={file} />
      </ShareModalProvider>
    </ViewerProvider>
  )

describe('SharingButton', () => {
  it('renders by default', () => {
    renderSharingButton()

    expect(screen.getByText('share file-1')).toBeInTheDocument()
  })

  it('does not render when sharing actions are disabled', () => {
    renderSharingButton({
      componentsProps: {
        sharingActions: { disabled: true }
      }
    })

    expect(screen.queryByText('share file-1')).not.toBeInTheDocument()
  })
})
