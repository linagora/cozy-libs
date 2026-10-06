import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

import KnowledgeBaseChip from './KnowledgeBaseChip'

jest.mock('cozy-flags', () => jest.fn())
jest.mock('cozy-client', () => ({
  useClient: () => ({
    getStackClient: () => ({ uri: 'https://alice.cozy.example' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }),
  generateWebLink: ({ hash }) => `https://alice-drive.cozy.example/#${hash}`
}))
jest.mock('cozy-intent', () => ({
  useWebviewIntent: () => null
}))
jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => {
  const useBreakpoints = () => ({ isMobile: false })
  return { __esModule: true, default: useBreakpoints, useBreakpoints }
})
jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key })
}))
jest.mock('./FolderPickerDialog', () => () => (
  <div data-testid="folder-picker" />
))

const CHANGE_FOLDER = 'assistant.knowledge_base.change_folder'
const OPEN_FOLDER = 'assistant.knowledge_base.open_folder'

const setup = props =>
  render(
    <KnowledgeBaseChip
      dirId="folder-id"
      folder={{ _id: 'folder-id', name: 'Meetings' }}
      isRoot={false}
      isUnavailable={false}
      onChangeFolder={jest.fn()}
      {...props}
    />
  )

const mockCreateAssistantFlag = isEnabled =>
  flag.mockImplementation(name =>
    name === 'cozy.assistant.create-assistant.enabled' ? isEnabled : null
  )

describe('KnowledgeBaseChip', () => {
  beforeEach(() => {
    flag.mockReset()
  })

  describe('when creating assistants is enabled', () => {
    beforeEach(() => {
      mockCreateAssistantFlag(true)
    })

    it('offers to open the folder and to change it', () => {
      setup()
      fireEvent.click(screen.getByRole('button', { name: 'Meetings' }))

      expect(screen.queryByText(OPEN_FOLDER)).not.toBe(null)
      expect(screen.queryByText(CHANGE_FOLDER)).not.toBe(null)
    })

    it('opens the folder picker from the menu', () => {
      setup()
      fireEvent.click(screen.getByRole('button', { name: 'Meetings' }))
      fireEvent.click(screen.getByText(CHANGE_FOLDER))

      expect(screen.queryByTestId('folder-picker')).not.toBe(null)
    })

    it('still offers to change an unavailable folder', () => {
      setup({ isUnavailable: true })
      fireEvent.click(
        screen.getByRole('button', {
          name: 'assistant.knowledge_base.unavailable'
        })
      )

      expect(screen.queryByText(OPEN_FOLDER)).toBe(null)
      expect(screen.queryByText(CHANGE_FOLDER)).not.toBe(null)
    })
  })

  describe('when creating assistants is disabled', () => {
    beforeEach(() => {
      mockCreateAssistantFlag(false)
    })

    it('only offers to open the folder', () => {
      setup()
      fireEvent.click(screen.getByRole('button', { name: 'Meetings' }))

      expect(screen.queryByText(OPEN_FOLDER)).not.toBe(null)
      expect(screen.queryByText(CHANGE_FOLDER)).toBe(null)
      expect(screen.queryByTestId('folder-picker')).toBe(null)
    })

    it('only offers to open the folder from the icon button', () => {
      setup({ variant: 'icon' })
      fireEvent.click(screen.getByRole('button', { name: 'Meetings' }))

      expect(screen.queryByText(OPEN_FOLDER)).not.toBe(null)
      expect(screen.queryByText(CHANGE_FOLDER)).toBe(null)
    })

    it('does not open an empty menu for an unavailable folder', () => {
      setup({ isUnavailable: true })

      expect(
        screen.queryByRole('button', {
          name: 'assistant.knowledge_base.unavailable'
        })
      ).toBe(null)
      expect(screen.queryByRole('menu')).toBe(null)
    })
  })
})
