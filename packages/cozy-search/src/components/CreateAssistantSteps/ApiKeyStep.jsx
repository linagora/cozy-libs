import React from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Button'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import EyeIcon from 'cozy-ui/transpiled/react/Icons/Eye'
import LinkOutIcon from 'cozy-ui/transpiled/react/Icons/LinkOut'
import TextField from 'cozy-ui/transpiled/react/TextField'
import Typography from 'cozy-ui/transpiled/react/Typography'

const ApiKeyStep = ({ apiKey, modelProvider, onChange }) => {
  const { t } = useI18n()
  return (
    <div className="u-flex u-flex-column u-gap-1">
      <Typography variant="body1" className="u-mb-1 u-c-text-secondary">
        {t('assistant_create.steps.api_key.description', {
          provider: modelProvider
        })}
      </Typography>

      <div className="u-mb-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.api_key.label')}
        </Typography>
        <TextField
          fullWidth
          placeholder={t('assistant_create.steps.api_key.placeholder')}
          value={apiKey}
          onChange={onChange('apiKey')}
          variant="outlined"
          type="password"
          InputProps={{
            endAdornment: (
              <IconButton>
                <Icon icon={EyeIcon} />
              </IconButton>
            )
          }}
        />
        <Typography variant="caption" className="u-mt-half u-db">
          {t('assistant_create.steps.api_key.hint')}
        </Typography>
      </div>

      <div className="u-bg-paleGrey u-p-1 u-br-1">
        <Typography variant="h6" className="u-mb-half">
          {t('assistant_create.steps.api_key.no_key')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {t('assistant_create.steps.api_key.generate', {
            provider: modelProvider
          })}
        </Typography>
        <Button
          variant="text"
          className="u-mt-half"
          href="#"
          component="a"
          endIcon={<Icon icon={LinkOutIcon} size={12} />}
          size="small"
        >
          {t('assistant_create.steps.api_key.learn')}
        </Button>
      </div>
    </div>
  )
}

export default ApiKeyStep
