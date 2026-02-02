import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from 'twake-i18n'

import Card from 'cozy-ui/transpiled/react/Card'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import EyeIcon from 'cozy-ui/transpiled/react/Icons/Eye'
import SelectBox from 'cozy-ui/transpiled/react/SelectBox'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'

const ApiKeyStep = ({ apiKey, selectedProvider, onChange, onModelSelect }) => {
  const [showPassword, setShowPassword] = useState(false)

  const { t } = useI18n()
  const {
    models,
    id,
    name: providerName,
    model,
    baseUrl
  } = selectedProvider || {}

  const isCustomModel = id === 'custom'

  const mappedModels = useMemo(
    () =>
      models?.map(model => ({
        label: model,
        value: model
      })),
    [models]
  )

  return (
    <div className="u-flex u-flex-column u-gap-1">
      <Typography variant="body1" className="u-mb-1 u-c-text-secondary">
        {isCustomModel
          ? t(
              'assistant_create.steps.configuration.custom_provider_description'
            )
          : t('assistant_create.steps.configuration.description')}
      </Typography>

      {isCustomModel && (
        <div className="u-mb-1">
          <Typography variant="h6" className="u-mb-half">
            {t('assistant_create.steps.configuration.provider.label')}
          </Typography>
          <TextField
            fullWidth
            placeholder={t(
              'assistant_create.steps.configuration.provider.placeholder'
            )}
            value={providerName}
            onChange={onChange('model')}
            variant="outlined"
            type="text"
          />
        </div>
      )}

      {isCustomModel && (
        <div className="u-mb-1">
          <Typography variant="h6" className="u-mb-half">
            {t('assistant_create.steps.configuration.url.label')}
          </Typography>
          <TextField
            fullWidth
            placeholder={t(
              'assistant_create.steps.configuration.url.placeholder'
            )}
            value={baseUrl}
            onChange={onChange('baseUrl')}
            variant="outlined"
            type="text"
          />
        </div>
      )}

      {!isCustomModel && (
        <div className="u-mb-1">
          <Typography variant="h6" className="u-mb-half">
            {t('assistant_create.steps.configuration.model.label')}
          </Typography>
          <SelectBox
            options={mappedModels}
            value={{ label: model, value: model }}
            onChange={selectedModel => onModelSelect(selectedModel.value)}
          />
        </div>
      )}

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.configuration.api_key.label')}
        </Typography>
        <TextField
          fullWidth
          placeholder={t(
            'assistant_create.steps.configuration.api_key.placeholder'
          )}
          value={apiKey}
          onChange={onChange('apiKey')}
          variant="outlined"
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <IconButton
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={
                  showPassword ? t('assistant.hide') : t('assistant.show')
                }
              >
                <Icon icon={EyeIcon} />
              </IconButton>
            )
          }}
        />
      </div>

      <Card className="u-bg-paleGrey u-p-1 u-bdw-0">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.configuration.no_key')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          <span>
            {t('assistant_create.steps.configuration.generate', {
              provider: !isCustomModel
                ? providerName
                : t('assistant_create.steps.configuration.custom_provider')
            })}
          </span>
          <Link underline="hover" to="/" className="u-primaryColor">
            {t('assistant_create.steps.configuration.read_docs')}
          </Link>
        </Typography>
      </Card>
    </div>
  )
}

export default ApiKeyStep
