import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import flag from 'cozy-flags'

import TwakeKnowledgeSelector from './TwakeKnowledgeSelector'
import { AssistantContext } from '../AssistantProvider'
import { useSelectedAssistantKnowledgeBase } from '../KnowledgeBase/useSelectedAssistantKnowledgeBase'

jest.mock('cozy-flags', () => jest.fn())
jest.mock('twake-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
jest.mock('react-router-dom', () => ({
  useParams: () => ({ conversationId: 'conv-1' })
}))
jest.mock('../KnowledgeBase/useSelectedAssistantKnowledgeBase', () => ({
  useSelectedAssistantKnowledgeBase: jest.fn()
}))
jest.mock('./DriveSourceChip', () => {
  const MockDriveSourceChip = () => <div data-testid="drive-source-chip" />
  return { __esModule: true, default: MockDriveSourceChip }
})
jest.mock('./TwakeKnowledgeChip', () => {
  const MockStaticChip = () => <div data-testid="static-chip" />
  return { __esModule: true, default: MockStaticChip }
})
jest.mock('./WebSearchChip', () => {
  const MockWebSearchChip = () => null
  return { __esModule: true, default: MockWebSearchChip }
})
jest.mock('../KnowledgeBase/KnowledgeBaseChip', () => {
  const MockKbChip = () => <div data-testid="kb-chip" />
  return { __esModule: true, default: MockKbChip }
})
jest.mock('../KnowledgeBase/AttachmentsResolver', () => {
  const MockResolver = () => <div data-testid="attachments-resolver" />
  return { __esModule: true, default: MockResolver }
})

const renderSelector = ({
  attachmentsFlag = true,
  isRealAssistant = false,
  dirId = null,
  selection
} = {}) => {
  flag.mockImplementation(
    name => name === 'cozy.assistant.attachments.enabled' && attachmentsFlag
  )
  useSelectedAssistantKnowledgeBase.mockReturnValue({
    dirId,
    folder: null,
    isUnavailable: false,
    setKnowledgeBaseFolder: jest.fn(),
    isRealAssistant,
    hasEmail: false
  })
  const contextValue = {
    attachmentsSelections: selection ? { 'conv-1': selection } : {},
    attachmentsResolutions: {},
    setAttachmentsSelection: jest.fn()
  }
  render(
    <AssistantContext.Provider value={contextValue}>
      <TwakeKnowledgeSelector />
    </AssistantContext.Provider>
  )
}

describe('TwakeKnowledgeSelector', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the interactive Drive chip for the default assistant', () => {
    renderSelector()
    expect(screen.getByTestId('drive-source-chip')).toBeInTheDocument()
    expect(screen.queryByTestId('static-chip')).not.toBeInTheDocument()
  })

  it('keeps the static Drive chip when the flag is off', () => {
    renderSelector({ attachmentsFlag: false })
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
    expect(screen.getByTestId('static-chip')).toBeInTheDocument()
  })

  it('keeps the static Drive chip for a custom assistant without KB', () => {
    renderSelector({ isRealAssistant: true })
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
    expect(screen.getByTestId('static-chip')).toBeInTheDocument()
  })

  it('keeps the knowledge-base chip for a custom assistant with KB', () => {
    renderSelector({ isRealAssistant: true, dirId: 'kb-dir' })
    expect(screen.getByTestId('kb-chip')).toBeInTheDocument()
    expect(screen.queryByTestId('drive-source-chip')).not.toBeInTheDocument()
  })

  it('mounts the resolver only when a selection is active', () => {
    renderSelector()
    expect(
      screen.queryByTestId('attachments-resolver')
    ).not.toBeInTheDocument()

    renderSelector({ selection: [{ id: 'd1', type: 'directory' }] })
    expect(screen.getByTestId('attachments-resolver')).toBeInTheDocument()
  })
})
