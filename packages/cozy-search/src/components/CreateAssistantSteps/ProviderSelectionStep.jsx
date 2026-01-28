import React from 'react'
import { useI18n } from 'twake-i18n'

import Alert from 'cozy-ui/transpiled/react/Alert'
import Typography from 'cozy-ui/transpiled/react/Typography'

import Provider from './Provider'
import providers from './providers.json'
import styles from './styles.styl'

const ProviderSelectionStep = ({ selectedProvider, onSelect }) => {
  const { t } = useI18n()
  return (
    <div className={`u-flex u-flex-column ${styles.ModelSelectionStep}`}>
      <Typography variant="body1" className="u-mb-1 u-c-text-secondary">
        {t('assistant_create.steps.provider_selection.description')}
      </Typography>
      <div className={styles['grid-container']}>
        {providers.map(provider => (
          <Provider
            key={provider.id}
            provider={provider}
            selectedProvider={selectedProvider}
            onSelect={onSelect}
          />
        ))}
      </div>
      {selectedProvider?.external && (
        <Alert severity="primary" className="u-mt-1">
          {t('assistant_create.steps.provider_selection.external_warning')}
        </Alert>
      )}
    </div>
  )
}

export default ProviderSelectionStep
