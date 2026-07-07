import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import EditAssistantDialog from './EditAssistantDialog'

const mockEditAssistant = jest.fn()
jest.mock('cozy-client/dist/models/assistant', () => ({
  editAssistant: (...args) => mockEditAssistant(...args)
}))

const mockSaveKnowledgeBase = jest.fn()
jest.mock('../KnowledgeBase/knowledgeBase', () => ({
  saveKnowledgeBase: (...args) => mockSaveKnowledgeBase(...args)
}))

const mockAssistantDoc = {
  _id: 'assistant-1',
  name: 'My assistant',
  prompt: 'prompt',
  icon: null,
  knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }],
  relationships: {
    provider: { data: { metadata: { providerId: 'openrag' } } }
  }
}
const mockClient = {
  query: jest.fn().mockResolvedValue({
    data: mockAssistantDoc,
    included: [{ auth: { login: 'model' }, data: { baseUrl: '' } }]
  })
}
jest.mock('cozy-client', () => ({
  useClient: () => mockClient,
  Q: () => ({ getById: () => ({ include: () => ({}) }) })
}))

jest.mock('../AssistantProvider', () => ({
  useAssistant: () => ({
    assistantIdInAction: 'assistant-1',
    setSelectedAssistantId: jest.fn()
  })
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

const mockSetFormData = jest.fn()
const mockFormData = {
  name: 'My assistant',
  description: 'prompt',
  icon: null,
  model: 'model',
  apiKey: '',
  baseUrl: '',
  encryptedApiKey: 'enc',
  knowledgeBase: []
}
jest.mock('../CreateAssistantSteps/useAssistantDialog', () => ({
  STEPS: { BASIC_INFO: 0, MODEL_SELECTION: 1, API_KEY: 2 },
  useAssistantDialog: () => ({
    step: 2,
    formData: mockFormData,
    selectedProvider: { id: 'openrag' },
    canSubmit: true,
    setFormData: mockSetFormData,
    setSelectedProvider: jest.fn(),
    handleBack: jest.fn(),
    handleNext: async onSubmit => onSubmit(),
    handleChange: () => jest.fn(),
    handleProviderSelection: jest.fn(),
    handleAvatarChange: jest.fn(),
    isNextDisabled: () => false,
    handleChangeModel: jest.fn()
  })
}))

describe('EditAssistantDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('pre-fills formData.knowledgeBase from the assistant doc', async () => {
    render(<EditAssistantDialog open onClose={jest.fn()} />)

    await waitFor(() =>
      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeBase: [{ doctype: 'io.cozy.files', folderId: 'folder-1' }]
        })
      )
    )
  })

  it('always saves the knowledge base on submit (supports removal)', async () => {
    render(<EditAssistantDialog open onClose={jest.fn()} />)

    fireEvent.click(screen.getByText('assistant_edit.buttons.edit'))

    await waitFor(() =>
      expect(mockSaveKnowledgeBase).toHaveBeenCalledWith(
        mockClient,
        'assistant-1',
        mockFormData.knowledgeBase
      )
    )
    expect(mockEditAssistant).toHaveBeenCalled()
  })
})
