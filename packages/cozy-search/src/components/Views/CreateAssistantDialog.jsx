import React, { useState } from 'react'
import { useI18n, useExtendI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import {
  DialogContent,
  DialogActions,
  DialogTitle
} from 'cozy-ui/transpiled/react/Dialog'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'

import { locales } from '../../locales'
import ApiKeyStep from '../CreateAssistantSteps/ApiKeyStep'
import BasicInfoStep from '../CreateAssistantSteps/BasicInfoStep'
import ModelSelectionStep from '../CreateAssistantSteps/ModelSelectionStep'
import styles from '../CreateAssistantSteps/styles.styl'

const STEPS = {
  BASIC_INFO: 0,
  MODEL_SELECTION: 1,
  API_KEY: 2
}

const CreateAssistantDialog = ({ open, onClose }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const [step, setStep] = useState(STEPS.BASIC_INFO)
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    avatar: null,
    model: null,
    apiKey: ''
  })

  const handleNext = () => {
    if (step === STEPS.API_KEY) {
      onClose()
    } else {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (step === STEPS.BASIC_INFO) {
      onClose()
    } else {
      setStep(prev => prev - 1)
    }
  }

  const handleChange = field => event => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleModelSelect = model => {
    setFormData(prev => ({ ...prev, model }))
  }

  const handleAvatarChange = avatarData => {
    setFormData(prev => ({ ...prev, avatar: avatarData }))
  }

  const renderContent = () => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return (
          <BasicInfoStep
            name={formData.name}
            instructions={formData.instructions}
            avatar={formData.avatar}
            onChange={handleChange}
            onAvatarChange={handleAvatarChange}
          />
        )
      case STEPS.MODEL_SELECTION:
        return (
          <ModelSelectionStep
            selectedModel={formData.model}
            onSelect={handleModelSelect}
          />
        )
      case STEPS.API_KEY:
        return (
          <ApiKeyStep
            apiKey={formData.apiKey}
            modelProvider={formData.model?.provider}
            onChange={handleChange}
          />
        )
      default:
        return null
    }
  }

  const getTitle = () => {
    if (step === STEPS.API_KEY) {
      return t('assistant_create.configure_api_key', {
        provider: formData.model?.provider || 'Model'
      })
    }
    return t('assistant_create.title')
  }

  const isNextDisabled = () => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return !formData.name.trim() || !formData.instructions.trim()
      case STEPS.MODEL_SELECTION:
        return !formData.model
      case STEPS.API_KEY:
        return !formData.apiKey.trim()
      default:
        return false
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      className={styles.CreateAssistantDialog}
    >
      <DialogTitle disableTypography={true}>{getTitle()}</DialogTitle>
      <IconButton onClick={onClose} className={styles['close-button']}>
        <Icon icon={CrossIcon} />
      </IconButton>
      <DialogContent>{renderContent()}</DialogContent>
      <DialogActions>
        <Button
          variant="secondary"
          onClick={handleBack}
          label={t('assistant_create.buttons.cancel')}
        />
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={isNextDisabled()}
          label={
            step === STEPS.API_KEY
              ? t('assistant_create.buttons.create')
              : t('assistant_create.buttons.next')
          }
        />
      </DialogActions>
    </Dialog>
  )
}

export default CreateAssistantDialog
