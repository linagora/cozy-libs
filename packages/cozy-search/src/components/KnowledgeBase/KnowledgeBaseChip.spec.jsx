import { render, screen } from '@testing-library/react'
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
  it('links to the folder in Drive in a new tab, without a remove control', () => {
    const { container } = render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={{ _id: 'folder-1', name: 'HR' }}
        isUnavailable={false}
        isLast
      />
    )

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe(
      'https://claude-drive.mycozy.cloud/#/folder/folder-1'
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(screen.getByText('HR')).toBeTruthy()
    // informational chip: the knowledge base is edited via the assistant
    // edit dialog, never from the composer
    expect(container.querySelector('[class*="deleteIcon"]')).toBeNull()
  })

  it('shows the unavailable state without a link', () => {
    render(
      <KnowledgeBaseChip
        folderId="folder-1"
        folder={null}
        isUnavailable
        isLast
      />
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.getByText('assistant.knowledge_base.unavailable')
    ).toBeTruthy()
  })
})
