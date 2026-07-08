import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import KnowledgeBaseChip from './KnowledgeBaseChip'

let mockPickerProps = null
jest.mock('./FolderPickerDialog', () => props => {
  mockPickerProps = props
  return props.open ? <div data-testid="folder-picker" /> : null
})

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

// cozy-ui's ActionsMenu calls cozy-intent's useWebviewIntent, whose hoisted
// copy ships its own React in the test env (invalid-hook-call otherwise)
jest.mock('cozy-intent', () => ({
  useWebviewIntent: () => null
}))

describe('KnowledgeBaseChip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPickerProps = null
  })

  const setup = (props = {}) =>
    render(
      <BreakpointsProvider>
        <KnowledgeBaseChip
          folderId="folder-1"
          folder={{ _id: 'folder-1', name: 'HR', path: '/Perso/HR' }}
          isUnavailable={false}
          isLast
          onChangeFolder={jest.fn()}
          {...props}
        />
      </BreakpointsProvider>
    )

  it('shows the folder name and does not navigate on chip click', () => {
    setup()

    expect(screen.getByText('HR')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('opens a menu with an Open in Drive link and no folder header', () => {
    setup()

    fireEvent.click(screen.getByText('HR'))

    // no name/path header in the menu, actions only
    expect(screen.queryByText('/Perso/HR')).toBeNull()
    const link = screen
      .getByText('assistant.knowledge_base.open_folder')
      .closest('a')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe(
      'https://claude-drive.mycozy.cloud/#/folder/folder-1'
    )
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('opens the Drive folder picker from Change folder and persists the pick', () => {
    const onChangeFolder = jest.fn()
    setup({ onChangeFolder })

    fireEvent.click(screen.getByText('HR'))
    fireEvent.click(screen.getByText('assistant.knowledge_base.change_folder'))

    expect(screen.getByTestId('folder-picker')).toBeTruthy()

    const picked = { id: 'folder-2', name: 'Legal', type: 'directory' }
    mockPickerProps.onSelect(picked)
    expect(onChangeFolder).toHaveBeenCalledWith(picked)
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
