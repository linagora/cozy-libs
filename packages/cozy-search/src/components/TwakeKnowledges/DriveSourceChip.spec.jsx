import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import DriveSourceChip from './DriveSourceChip'
import { AssistantContext } from '../AssistantProvider'

jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('cozy-client', () => ({
  useClient: () => ({
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }),
  generateWebLink: ({ hash }) => `https://drive/#${hash}`
}))
jest.mock('@linagora/twake-icons', () => ({
  Icon: () => null,
  Dropdown: () => null,
  LinkOut: () => null,
  Pen: () => null
}))
jest.mock('cozy-ui/transpiled/react/Chips', () => {
  const MockChip = ({ label, onClick }) => (
    <button data-testid="chip" onClick={onClick}>
      {label}
    </button>
  )
  return { __esModule: true, default: MockChip }
})
jest.mock('cozy-ui/transpiled/react/ActionsMenu', () => {
  const MockMenu = ({ children }) => <div role="menu">{children}</div>
  return { __esModule: true, default: MockMenu }
})
jest.mock('cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem', () => {
  const MockItem = ({ children, onClick, ...props }) => (
    <button role="menuitem" onClick={onClick} {...props}>
      {children}
    </button>
  )
  return { __esModule: true, default: MockItem }
})
jest.mock('cozy-ui/transpiled/react/Typography', () => {
  const MockTypography = ({ children }) => <span>{children}</span>
  return { __esModule: true, default: MockTypography }
})
jest.mock('../KnowledgeBase/FolderPickerDialog', () => {
  const MockPicker = ({ onSelect }) => (
    <button
      data-testid="picker"
      onClick={() => onSelect([{ id: 'd1', type: 'directory', name: 'Bills' }])}
    >
      picker
    </button>
  )
  return { __esModule: true, default: MockPicker }
})

const renderChip = ({ selection, resolution } = {}) => {
  const setAttachmentsSelection = jest.fn()
  const contextValue = {
    attachmentsSelections: selection ? { 'conv-1': selection } : {},
    attachmentsResolutions: resolution ? { 'conv-1': resolution } : {},
    setAttachmentsSelection
  }
  render(
    <AssistantContext.Provider value={contextValue}>
      <DriveSourceChip conversationId="conv-1" isLast />
    </AssistantContext.Provider>
  )
  return { setAttachmentsSelection }
}

describe('DriveSourceChip', () => {
  it('shows the generic Drive label and offers picking from the menu', () => {
    renderChip()
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.twake_knowledges.drive'
    )

    fireEvent.click(screen.getByTestId('chip'))
    expect(
      screen.getByText('assistant.attachments.all_documents')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('assistant.attachments.choose'))
    expect(screen.getByTestId('picker')).toBeInTheDocument()
  })

  it('stores the picked docs for the conversation', () => {
    const { setAttachmentsSelection } = renderChip()
    fireEvent.click(screen.getByTestId('chip'))
    fireEvent.click(screen.getByText('assistant.attachments.choose'))
    fireEvent.click(screen.getByTestId('picker'))
    expect(setAttachmentsSelection).toHaveBeenCalledWith('conv-1', [
      { id: 'd1', type: 'directory', name: 'Bills' }
    ])
  })

  it('labels a single selected folder with its name and can reset', () => {
    const { setAttachmentsSelection } = renderChip({
      selection: [{ id: 'd1', type: 'directory', name: 'Bills' }]
    })
    expect(screen.getByTestId('chip')).toHaveTextContent('Bills')

    fireEvent.click(screen.getByTestId('chip'))
    fireEvent.click(screen.getByText('assistant.attachments.all_documents'))
    expect(setAttachmentsSelection).toHaveBeenCalledWith('conv-1', null)
  })

  it('labels a multi selection with the item count', () => {
    renderChip({
      selection: [
        { id: 'f1', type: 'file', name: 'a.pdf' },
        { id: 'f2', type: 'file', name: 'b.pdf' }
      ]
    })
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.attachments.items'
    )
  })

  it('surfaces over-limit and unavailable states on the label', () => {
    renderChip({
      selection: [{ id: 'd1', type: 'directory', name: 'Bills' }],
      resolution: {
        attachmentIds: [],
        isOverLimit: true,
        isLoading: false,
        isUnavailable: false
      }
    })
    expect(screen.getByTestId('chip')).toHaveTextContent(
      'assistant.attachments.over_limit'
    )
  })
})
