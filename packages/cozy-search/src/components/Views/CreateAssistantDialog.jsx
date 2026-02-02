import React from 'react'
import { useI18n, useExtendI18n } from 'twake-i18n'

import { useClient } from 'cozy-client'
import { createAssistant } from 'cozy-client/dist/models/assistant'
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
import { useAlert } from 'cozy-ui/transpiled/react/providers/Alert'

import { locales } from '../../locales'
import AssistantDialogContent from '../CreateAssistantSteps/AssistantDialogContent'
import styles from '../CreateAssistantSteps/styles.styl'
import {
  useAssistantDialog,
  STEPS
} from '../CreateAssistantSteps/useAssistantDialog'

const CreateAssistantDialog = ({ open, onClose }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const client = useClient()
  const { showAlert } = useAlert()

  const {
    step,
    formData,
    selectedProvider,
    handleBack,
    handleNext,
    handleChange,
    handleProviderSelection,
    handleAvatarChange,
    isNextDisabled,
    handleChangeModel
  } = useAssistantDialog({ onClose })

  const getTitle = () => {
    if (step === STEPS.API_KEY) {
      return t('assistant_create.configure_api_key_title')
    }
    return t('assistant_create.title')
  }

  const onSubmit = async () => {
    await createAssistant(client, {
      name: formData.name,
      prompt: formData.description,
      icon: formData.icon,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      isCustomModel: formData.isCustomModel
    })
    showAlert({ message: t('assistant_create.success'), severity: 'success' })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      className={styles.CreateAssistantDialog}
    >
      <DialogTitle disableTypography={true}>{getTitle()}</DialogTitle>
      <IconButton
        aria-label={t('assistant.dialog.close')}
        onClick={onClose}
        className={styles['close-button']}
      >
        <Icon icon={CrossIcon} />
      </IconButton>
      <DialogContent>
        <AssistantDialogContent
          step={step}
          formData={formData}
          selectedProvider={selectedProvider}
          onChange={handleChange}
          onAvatarChange={handleAvatarChange}
          onProviderSelect={handleProviderSelection}
          onModelSelect={handleChangeModel}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="secondary"
          onClick={handleBack}
          label={t('assistant_create.buttons.cancel')}
        />
        <Button
          variant="primary"
          onClick={() => handleNext(onSubmit)}
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
