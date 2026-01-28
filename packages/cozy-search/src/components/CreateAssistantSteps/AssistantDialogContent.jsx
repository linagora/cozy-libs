import React from 'react'

import ApiKeyStep from './ApiKeyStep'
import BasicInfoStep from './BasicInfoStep'
import ProviderSelectionStep from './ProviderSelectionStep'
import { STEPS } from './useAssistantDialog'

const AssistantDialogContent = ({
  step,
  formData,
  selectedProvider,
  onChange,
  onAvatarChange,
  onProviderSelect,
  onModelSelect
}) => {
  switch (step) {
    case STEPS.BASIC_INFO:
      return (
        <BasicInfoStep
          name={formData.name}
          description={formData.description}
          icon={formData.icon}
          onChange={onChange}
          onAvatarChange={onAvatarChange}
        />
      )
    case STEPS.MODEL_SELECTION:
      return (
        <ProviderSelectionStep
          selectedProvider={selectedProvider}
          onSelect={onProviderSelect}
        />
      )
    case STEPS.API_KEY:
      return (
        <ApiKeyStep
          apiKey={formData.apiKey}
          selectedProvider={selectedProvider}
          onChange={onChange}
          onModelSelect={onModelSelect}
        />
      )
    default:
      return null
  }
}

export default AssistantDialogContent
