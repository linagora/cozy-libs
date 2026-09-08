import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import KnowledgeBaseChip from './KnowledgeBaseChip'

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key })
}))

// cozy-ui's ActionsMenu drags in the breakpoints/intent providers; this spec is
// about which entries the chip renders and where they point, so keep it thin.
jest.mock('cozy-ui/transpiled/react/ActionsMenu', () => {
  const react = require('react')
  return react.forwardRef(({ children }, ref) =>
    react.createElement('div', { ref }, children)
  )
})
jest.mock('cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem', () => {
  const react = require('react')
  return ({ children, component, ...props }) =>
    react.createElement('a', props, children)
})

const setup = props => {
  const onChangeFolder = jest.fn()
  render(
    <KnowledgeBaseChip
      icon="tdrive.png"
      folderName="Contracts"
      folderUrl="https://drive.example/folder/d42"
      onChangeFolder={onChangeFolder}
      {...props}
    />
  )
  return { onChangeFolder }
}

const openMenu = () => fireEvent.click(screen.getByText('Contracts'))

describe('KnowledgeBaseChip', () => {
  it('shows the folder name', () => {
    setup()
    expect(screen.getByText('Contracts')).toBeTruthy()
  })

  it('falls back to a placeholder while the folder is unknown', () => {
    setup({ folderName: undefined })
    expect(screen.getByText('…')).toBeTruthy()
  })

  it('opens the folder at the url resolved by the adapter', () => {
    setup()
    openMenu()

    const link = screen
      .getByText('assistant.knowledge_base.open_folder')
      .closest('a')
    expect(link).toHaveProperty('href', 'https://drive.example/folder/d42')
  })

  it('offers no folder link when the folder is unavailable', () => {
    setup({ isUnavailable: true })
    fireEvent.click(screen.getByText('assistant.knowledge_base.unavailable'))

    expect(
      screen.queryByText('assistant.knowledge_base.open_folder')
    ).toBeNull()
    // Changing the knowledge base stays possible, so the user can recover.
    expect(
      screen.getByText('assistant.knowledge_base.change_folder')
    ).toBeTruthy()
  })

  it('delegates changing the folder to the adapter, and closes the menu', () => {
    const { onChangeFolder } = setup()
    openMenu()
    fireEvent.click(screen.getByText('assistant.knowledge_base.change_folder'))

    expect(onChangeFolder).toHaveBeenCalledTimes(1)
    expect(
      screen.queryByText('assistant.knowledge_base.change_folder')
    ).toBeNull()
  })

  it('imports nothing from the cozy backend', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, 'KnowledgeBaseChip.jsx'),
      'utf8'
    )
    expect(src).not.toMatch(/from 'cozy-(client|flags|realtime)/)
  })
})
