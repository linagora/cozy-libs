import cx from 'classnames'
import React from 'react'
import { useI18n } from 'twake-i18n'

import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import PlusSmallIcon from 'cozy-ui/transpiled/react/Icons/PlusSmall'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import AnthropicLogo from '../../assets/anthropic.svg'
import GeminiLogo from '../../assets/gemini.svg'
import MetaLogo from '../../assets/meta.svg'
import MistralLogo from '../../assets/mistral.svg'
import OpenAILogo from '../../assets/open_ai.svg'
import OpenRagLogo from '../../assets/openrag.png'

const ICONS = {
  OpenRagLogo,
  GeminiLogo,
  OpenAILogo,
  MistralLogo,
  AnthropicLogo,
  MetaLogo,
  PlusSmallIcon
}

const Provider = ({ selectedProvider, provider, onSelect }) => {
  const { t } = useI18n()
  const isSelected = selectedProvider?.id === provider.id
  const isOpenRag = provider.id === 'openrag'

  return (
    <button
      type="button"
      className={`u-p-1 u-c-pointer u-flex u-flex-row u-flex-items-center ${
        styles['model-card']
      } ${isSelected ? styles.selected : ''} ${
        isOpenRag ? styles.openrag : ''
      }`}
      onClick={() => onSelect(provider)}
    >
      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-center u-flex-shrink-0 u-mr-1',
          styles['icon-container'],
          styles[`icon-container--${provider.id}`]
        )}
      >
        <Icon icon={ICONS[provider.icon]} size={40} />
      </div>
      <div className="u-flex-grow-1">
        <Typography
          variant="body1"
          className="u-flex u-flex-justify-between u-flex-items-start"
        >
          {provider.id === 'custom' ? t(provider.name) : provider.name}
        </Typography>
        <Typography variant="body2" className="u-mt-half u-c-text-secondary">
          {t(provider.description)}
        </Typography>
      </div>
      {isSelected && (
        <Icon
          icon={CheckIcon}
          className={`u-c-white u-bg-primary u-br-circle u-p-half ${styles['check-icon']}`}
          size={12}
        />
      )}
    </button>
  )
}

export default Provider
