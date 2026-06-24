import { Icon, Eye } from '@linagora/twake-icons'
import cx from 'classnames'
import React, { useState } from 'react'

import Box from 'cozy-ui/transpiled/react/Box'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import { checkIfModelUnsupported } from './helpers'

const ApiKeyStep = ({ formData, selectedProvider, onChange }) => {
  const { type: theme } = useCozyTheme()
  const [showPassword, setShowPassword] = useState(false)

  const { t } = useI18n()
  const { id, name: providerName } = selectedProvider || {}
  const {
    model = '',
    baseUrl = '',
    apiKey = '',
    encryptedApiKey = ''
  } = formData || {}

  const isCustomModel = id === 'custom'
  const isModelUnsupported = checkIfModelUnsupported(selectedProvider, model)

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

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.configuration.model.label')}
        </Typography>
        <TextField
          fullWidth
          placeholder={t(
            'assistant_create.steps.configuration.model.placeholder'
          )}
          value={model}
          onChange={onChange('model')}
          variant="outlined"
          type="text"
          error={isModelUnsupported}
          helperText={
            isModelUnsupported
              ? t('assistant_create.steps.configuration.model.unsupported')
              : undefined
          }
        />
      </div>

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.configuration.api_key.label')}
        </Typography>
        <TextField
          fullWidth
          placeholder={
            encryptedApiKey
              ? '••••••••••••'
              : t('assistant_create.steps.configuration.api_key.placeholder')
          }
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
                <Icon icon={Eye} />
              </IconButton>
            )
          }}
        />
      </div>

      <Box
        display="block"
        border={1}
        borderColor="var(--dividerColor)"
        borderRadius={8}
        padding={2}
        className={cx({
          'u-bg-primaryBackgroundLight': theme === 'light',
          'u-bg-coolGrey': theme === 'dark'
        })}
      >
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
        </Typography>
      </Box>
    </div>
  )
}

export default ApiKeyStep
