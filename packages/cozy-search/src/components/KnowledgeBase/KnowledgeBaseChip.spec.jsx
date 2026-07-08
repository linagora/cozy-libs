import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'

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

const mockSetAssistantIdInAction = jest.fn()
const mockSetIsOpenEditAssistant = jest.fn()
jest.mock('../AssistantProvider', () => ({
  useAssistant: () => ({
    selectedAssistantId: 'assistant-1',
    setAssistantIdInAction: mockSetAssistantIdInAction,
    setIsOpenEditAssistant: mockSetIsOpenEditAssistant
  })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

// cozy-ui's ActionsMenu calls cozy-intent's useWebviewIntent, whose hoisted
// copy ships its own React in the test env (invalid-hook-call otherwise)
jest.mock('cozy-intent', () => ({
  useWebviewIntent: () => null
}))

describe('KnowledgeBaseChip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const setup = (props = {}) =>
    render(
      <BreakpointsProvider>
        <KnowledgeBaseChip
          folderId="folder-1"
          folder={{ _id: 'folder-1', name: 'HR', path: '/Perso/HR' }}
          isUnavailable={false}
          isLast
          {...props}
        />
      </BreakpointsProvider>
    )

  it('shows the folder name and does not navigate on chip click', () => {
    setup()

    expect(screen.getByText('HR')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('opens a menu with the folder path and an Open in Drive link', () => {
    setup()

    fireEvent.click(screen.getByText('HR'))

    expect(screen.getByText('/Perso/HR')).toBeTruthy()
    // the menu item renders as an anchor but keeps MUI's menuitem role
    const link = screen
      .getByText('assistant.knowledge_base.open_folder')
      .closest('a')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe(
      'https://claude-drive.mycozy.cloud/#/folder/folder-1'
    )
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('opens the edit-assistant dialog from Change folder', () => {
    setup()

    fireEvent.click(screen.getByText('HR'))
    fireEvent.click(screen.getByText('assistant.knowledge_base.change_folder'))

    expect(mockSetAssistantIdInAction).toHaveBeenCalledWith('assistant-1')
    expect(mockSetIsOpenEditAssistant).toHaveBeenCalledWith(true)
  })

  it('hides the Drive link when the folder is unavailable but still offers Change folder', () => {
    setup({ folder: null, isUnavailable: true })

    fireEvent.click(screen.getByText('assistant.knowledge_base.unavailable'))

    expect(screen.queryByRole('link')).toBeNull()
    expect(
      screen.queryByText('assistant.knowledge_base.open_folder')
    ).toBeNull()
    expect(
      screen.getByText('assistant.knowledge_base.change_folder')
    ).toBeTruthy()
  })
})
