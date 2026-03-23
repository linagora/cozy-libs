import cx from 'classnames'
import React from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import PlusSmallIcon from 'cozy-ui/transpiled/react/Icons/PlusSmall'
import TwakeLogo from 'cozy-ui/transpiled/react/Icons/TwakeWorkplace'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useCozyTheme } from 'cozy-ui-plus/dist/providers/CozyTheme'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import AnthropicLogo from '../../assets/anthropic.svg'
import GeminiLogo from '../../assets/gemini.svg'
import MetaLogo from '../../assets/meta.svg'
import MistralLogo from '../../assets/mistral.svg'
import OpenAILogo from '../../assets/open_ai.svg'

const ICONS = {
  TwakeLogo,
  GeminiLogo,
  OpenAILogo,
  MistralLogo,
  AnthropicLogo,
  MetaLogo,
  PlusSmallIcon
}

const Provider = ({ selectedProvider, provider, onSelect }) => {
  const { t } = useI18n()
  const { type: theme } = useCozyTheme()
  const isSelected = selectedProvider?.id === provider.id
  const isOpenRag = provider.id === 'openrag'

  return (
    <button
      type="button"
      className={cx(
        'u-p-1 u-c-pointer u-flex u-flex-row u-flex-items-center',
        styles['model-card'],
        {
          [styles['model-card--selected']]: isSelected,
          [styles[`model-card--openrag--${theme}`]]: isOpenRag
        }
      )}
      onClick={() => onSelect(provider)}
    >
      <div
        className={cx(
          'u-flex u-flex-items-center u-flex-justify-center u-flex-shrink-0 u-mr-1',
          styles['icon-container'],
          styles[`icon-container--${provider.id}`]
        )}
      >
        {
          /* FIXME: the twake icon is not rendered properly with Icon */
          isOpenRag ? (
            <TwakeLogo width={40} height={40} />
          ) : (
            <Icon icon={ICONS[provider.icon]} size={40} preserveColor />
          )
        }
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
