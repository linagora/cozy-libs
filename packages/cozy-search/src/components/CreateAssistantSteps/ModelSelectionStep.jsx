import React from 'react'
import { useI18n } from 'twake-i18n'

import Icon from 'cozy-ui/transpiled/react/Icon'
import CheckIcon from 'cozy-ui/transpiled/react/Icons/Check'
import Typography from 'cozy-ui/transpiled/react/Typography'

import styles from './styles.styl'
import ClaudeLogo from '../../assets/claude.png'
import GeminiLogo from '../../assets/gemini.png'
import LlamaLogo from '../../assets/llama.png'
import MistralLogo from '../../assets/mistral.png'
import OpenAiLogo from '../../assets/open_ai.png'
import OpenRagLogo from '../../assets/open_rag.png'

const MODELS = [
  {
    id: 'openrag',
    name: 'OpenRAG',
    provider: 'LINAGORA',
    description: 'Work with drive files, chat, email from your Twake Workplace',
    icon: OpenRagLogo
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: "Google's most capable model for text and multimodal tasks",
    icon: GeminiLogo
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description:
      'Most capable GPT model, great for complex reasoning and creative tasks',
    icon: OpenAiLogo
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'Mistral AI',
    description: 'Efficient and powerful model with strong performance',
    icon: MistralLogo
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    description:
      'Helpful, harmless, and honest AI assistant with strong reasoning',
    icon: ClaudeLogo
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient model for most conversational tasks',
    icon: OpenAiLogo
  },
  {
    id: 'llama-2',
    name: 'Llama 2',
    provider: 'Meta',
    description: 'Open-source large language model for various applications',
    icon: LlamaLogo
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description:
      'Latest Claude model with enhanced capabilities and faster performance',
    icon: ClaudeLogo
  }
]

const ModelSelectionStep = ({ selectedModel, onSelect }) => {
  const { t } = useI18n()
  return (
    <div className={`u-flex u-flex-column ${styles.ModelSelectionStep}`}>
      <Typography variant="body1" className="u-mb-1 u-c-text-secondary">
        {t('assistant_create.steps.model_selection.description')}
      </Typography>
      <div className={styles['grid-container']}>
        {MODELS.map(model => {
          const isSelected = selectedModel?.id === model.id
          const isOpenRag = model.id === 'openrag'

          return (
            <div
              key={model.id}
              className={`u-p-1 u-c-pointer u-flex u-flex-row u-flex-items-center ${
                styles['model-card']
              } ${isSelected ? styles.selected : ''} ${
                isOpenRag ? styles.openrag : ''
              }`}
              onClick={() => onSelect(model)}
            >
              <div
                className={`u-flex-shrink-0 u-bg-paleGrey u-mr-1 ${styles['icon-container']}`}
                style={{
                  backgroundImage: `url(${model.icon})`
                }}
              />
              <div className="u-flex-grow-1">
                <div className="u-flex u-flex-justify-between u-flex-items-start">
                  <div>
                    <span className="u-fw-bold u-mr-half">{model.name}</span>
                    <span className="u-c-text-secondary u-fs-caption">
                      {t('assistant_create.steps.model_selection.by')}{' '}
                      {model.provider}
                    </span>
                  </div>
                </div>
                <Typography
                  variant="body2"
                  className="u-mt-half u-c-text-secondary"
                >
                  {model.description}
                </Typography>
              </div>
              {isSelected && (
                <Icon
                  icon={CheckIcon}
                  className={`u-c-white u-bg-primary u-br-circle u-p-half ${styles['check-icon']}`}
                  size={16}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ModelSelectionStep
