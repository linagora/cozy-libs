import { useMemo, useState } from 'react'

import Minilog from 'cozy-minilog'
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'
import { useI18n, useExtendI18n } from 'twake-i18n'

import { locales } from '../../locales'
import { OPENRAG_MODEL } from '../constants'

const log = Minilog('[AssistantDialog]')

export const STEPS = {
  BASIC_INFO: 0,
  MODEL_SELECTION: 1,
  API_KEY: 2
}

/**
 * Hook to manage the state and logic of Assistant Dialogs (Create/Edit).
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Object} [props.initialData] - Initial formData
 */
export const useAssistantDialog = ({ onClose, initialData = {} }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const { showAlert } = useAlert()

  const [step, setStep] = useState(STEPS.BASIC_INFO)
  const [selectedProvider, setSelectedProvider] = useState(
    initialData.selectedProvider || null
  )

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: null,
    model: '',
    baseUrl: '',
    apiKey: '',
    ...initialData
  })

  const canSubmit = useMemo(
    () =>
      step === STEPS.API_KEY ||
      (step === STEPS.MODEL_SELECTION &&
        selectedProvider?.id === OPENRAG_MODEL),
    [step, selectedProvider?.id]
  )

  const handleChange = field => event => {
    const value = event.target?.value !== undefined ? event.target.value : event
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChangeModel = value => {
    handleChange('model')({
      target: { value }
    })
    setSelectedProvider(prev => (prev ? { ...prev, model: value } : prev))
  }

  const handleAvatarChange = avatarData => {
    setFormData(prev => ({ ...prev, icon: avatarData }))
  }

  const handleProviderSelection = provider => {
    const isOpenrag = provider.id === OPENRAG_MODEL
    setFormData(prev => ({
      ...prev,
      baseUrl: provider.baseUrl ?? '',
      model: isOpenrag ? provider.models[0] : '',
      apiKey: '',
      encryptedApiKey: '',
      providerId: provider.id
    }))
    setSelectedProvider({
      ...provider,
      name: provider.id === 'custom' ? undefined : provider.name
    })
  }

  const handleBack = () => {
    if (step === STEPS.BASIC_INFO) {
      onClose()
    } else {
      setStep(prev => prev - 1)
    }
  }

  /**
   * Handles the Next button click.
   * @param {Function} onSubmit - Async function to execute on the final step (Create/Edit).
   */
  const handleNext = async onSubmit => {
    try {
      if (canSubmit) {
        await onSubmit(formData)
        onClose()
      } else {
        setStep(prev => prev + 1)
      }
    } catch (error) {
      log.error('Error in handleNext:', error)
      showAlert({ message: t('assistant.default_error'), severity: 'error' })
    }
  }

  const isNextDisabled = isAllowToSkipApiKey => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return !formData.name?.trim()
      case STEPS.MODEL_SELECTION:
        return !selectedProvider
      case STEPS.API_KEY:
        return !formData.apiKey?.trim() && !isAllowToSkipApiKey
      default:
        return false
    }
  }

  return {
    step,
    setStep,
    formData,
    setFormData,
    selectedProvider,
    setSelectedProvider,
    handleChange,
    handleAvatarChange,
    handleProviderSelection,
    handleBack,
    handleNext,
    isNextDisabled,
    handleChangeModel,
    canSubmit
  }
}
