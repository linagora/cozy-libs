import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import CreateAssistantDialog from './CreateAssistantDialog'

const mockCreateAssistant = jest.fn()
jest.mock('cozy-client/dist/models/assistant', () => ({
  createAssistant: (...args) => mockCreateAssistant(...args)
}))

const mockSaveKnowledgeBase = jest.fn()
jest.mock('../KnowledgeBase/knowledgeBase', () => ({
  saveKnowledgeBase: (...args) => mockSaveKnowledgeBase(...args)
}))

const mockClient = {}
jest.mock('cozy-client', () => ({
  useClient: () => mockClient
}))

jest.mock('../AssistantProvider', () => ({
  useAssistant: () => ({ setSelectedAssistantId: jest.fn() })
}))

jest.mock('cozy-ui/transpiled/react/providers/Alert', () => ({
  useAlert: () => ({ showAlert: jest.fn() })
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  useBreakpoints: () => ({ isMobile: false })
}))

jest.mock('twake-i18n', () => ({
  useI18n: () => ({ t: key => key }),
  useExtendI18n: jest.fn()
}))

jest.mock('../CreateAssistantSteps/AssistantDialogContent', () => () => null)

const mockFormData = {
  name: 'My assistant',
  description: 'prompt',
  icon: null,
  model: 'gpt',
  apiKey: 'key',
  baseUrl: '',
  knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
}
jest.mock('../CreateAssistantSteps/useAssistantDialog', () => ({
  STEPS: { BASIC_INFO: 0, MODEL_SELECTION: 1, API_KEY: 2 },
  useAssistantDialog: () => ({
    step: 2,
    formData: mockFormData,
    selectedProvider: { id: 'openrag' },
    canSubmit: true,
    handleBack: jest.fn(),
    handleNext: async onSubmit => onSubmit(),
    handleChange: () => jest.fn(),
    handleProviderSelection: jest.fn(),
    handleAvatarChange: jest.fn(),
    isNextDisabled: () => false,
    handleChangeModel: jest.fn()
  })
}))

describe('CreateAssistantDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateAssistant.mockResolvedValue({ _id: 'assistant-1' })
  })

  it('saves the knowledge base after creating the assistant', async () => {
    render(<CreateAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_create.buttons.create'))

    await waitFor(() =>
      expect(mockSaveKnowledgeBase).toHaveBeenCalledWith(
        mockClient,
        'assistant-1',
        mockFormData.knowledgeBase
      )
    )
    expect(mockCreateAssistant).toHaveBeenCalled()
  })

  it('skips the knowledge base save when none is selected', async () => {
    mockFormData.knowledgeBase = []
    render(<CreateAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_create.buttons.create'))

    await waitFor(() => expect(mockCreateAssistant).toHaveBeenCalled())
    expect(mockSaveKnowledgeBase).not.toHaveBeenCalled()
    mockFormData.knowledgeBase = [
      { doctype: 'io.cozy.files', folderId: 'folder-1' }
    ]
  })
})
