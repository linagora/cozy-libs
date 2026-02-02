import React, { useEffect } from 'react'
import { useI18n, useExtendI18n } from 'twake-i18n'

import { useClient, Q } from 'cozy-client'
import { editAssistant } from 'cozy-client/dist/models/assistant'
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
import { useAssistant } from '../AssistantProvider'
import AssistantDialogContent from '../CreateAssistantSteps/AssistantDialogContent'
import { getSelectedProviderByModel } from '../CreateAssistantSteps/helpers'
import styles from '../CreateAssistantSteps/styles.styl'
import {
  useAssistantDialog,
  STEPS
} from '../CreateAssistantSteps/useAssistantDialog'

const EditAssistantDialog = ({ open, onClose }) => {
  useExtendI18n(locales)
  const { t } = useI18n()
  const client = useClient()
  const { assistantIdInAction } = useAssistant()
  const { showAlert } = useAlert()

  const {
    step,
    formData,
    selectedProvider,
    setFormData,
    setSelectedProvider,
    handleBack,
    handleNext,
    handleChange,
    handleProviderSelection,
    handleAvatarChange,
    isNextDisabled,
    handleChangeModel
  } = useAssistantDialog({ onClose })

  useEffect(() => {
    if (!open || !assistantIdInAction) return

    const fetchAssistant = async () => {
      const response = await client.query(
        Q('io.cozy.ai.chat.assistants')
          .getById(assistantIdInAction)
          .include(['provider'])
      )
      const assistant = response.data
      const provider = response.included[0]
      setFormData({
        name: assistant.name || '',
        description: assistant.prompt || '',
        icon: assistant.icon || '',
        isCustomModel: assistant.isCustomModel || false,
        model: provider?.auth?.login || '',
        baseUrl: provider?.data?.baseUrl || '',
        apiKey: provider?.auth?.apiKey || ''
      })

      const selectProviderDefault = getSelectedProviderByModel(
        provider?.auth?.login
      )
      setSelectedProvider({
        ...selectProviderDefault,
        model: provider?.auth?.login,
        baseUrl: provider?.data?.baseUrl
      })
    }
    fetchAssistant()
  }, [client, assistantIdInAction, open, setFormData, setSelectedProvider])

  const getTitle = () => {
    if (step === STEPS.API_KEY) {
      return t('assistant_edit.configure_api_key_title')
    }
    return t('assistant_edit.title')
  }

  const onSubmit = async () => {
    await editAssistant(client, assistantIdInAction, {
      name: formData.name,
      prompt: formData.description,
      icon: formData.icon,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      isCustomModel: formData.isCustomModel
    })
    showAlert({ message: t('assistant_edit.success'), severity: 'success' })
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
          label={t('assistant_edit.buttons.cancel')}
        />
        <Button
          variant="primary"
          onClick={() => handleNext(onSubmit)}
          disabled={isNextDisabled(true)}
          label={
            step === STEPS.API_KEY
              ? t('assistant_edit.buttons.edit')
              : t('assistant_edit.buttons.next')
          }
        />
      </DialogActions>
    </Dialog>
  )
}

export default EditAssistantDialog
