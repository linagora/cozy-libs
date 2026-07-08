import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import KnowledgeBaseChip from './KnowledgeBaseChip'

jest.mock('cozy-client', () => ({
  useClient: () => ({
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }),
  generateWebLink: jest.fn(
    ({ hash }) => `https://claude-drive.mycozy.cloud/#${hash}`
  )
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

describe('KnowledgeBaseChip', () => {
  it('links to the folder in Drive in a new tab', () => {
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={{ _id: 'folder-1', name: 'HR' }}
        isUnavailable={false}
        isLast
        onRemove={jest.fn()}
      />
    )

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe(
      'https://claude-drive.mycozy.cloud/#/folder/folder-1'
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.getByText('HR')).toBeTruthy()
  })

  it('removes the knowledge base from the cross without navigating', () => {
    const onRemove = jest.fn()
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={{ _id: 'folder-1', name: 'HR' }}
        isUnavailable={false}
        isLast
        onRemove={onRemove}
      />
    )

    fireEvent.click(screen.getByLabelText('assistant.knowledge_base.remove'))

    expect(onRemove).toHaveBeenCalled()
  })

  it('shows the unavailable state without a link but with the remove cross', () => {
    const onRemove = jest.fn()
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={null}
        isUnavailable
        isLast
        onRemove={onRemove}
      />
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.getByText('assistant.knowledge_base.unavailable')
    ).toBeTruthy()

    fireEvent.click(screen.getByLabelText('assistant.knowledge_base.remove'))
    expect(onRemove).toHaveBeenCalled()
  })
})
