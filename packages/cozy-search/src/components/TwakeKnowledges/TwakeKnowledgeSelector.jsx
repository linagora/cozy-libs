import cx from 'classnames'
import React from 'react'
import { useI18n } from 'twake-i18n'

import flag from 'cozy-flags'
import Chip from 'cozy-ui/transpiled/react/Chips'

import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { useAssistant } from '../AssistantProvider'

const TwakeKnowledgeSelector = ({ onSelectTwakeKnowledge }) => {
  const { t } = useI18n()
  const { openedKnowledgePanel, selectedTwakeKnowledge } = useAssistant()
  const twakeKnowledges = [
    {
      id: 'chat',
      label: t('assistant.twake_knowledges.chat'),
      display: flag('cozy.assistant.chat-knowledge-enable'),
      icon: TChat
    },
    {
      id: 'drive',
      label: t('assistant.twake_knowledges.drive'),
      display: true,
      icon: TDrive
    },
    {
      id: 'mail',
      label: t('assistant.twake_knowledges.mail'),
      display: true,
      icon: TMail
    }
  ]

  return (
    <div className="u-flex u-flex-row u-flex-wrap u-flex-items-center u-flex-justify-end">
      {twakeKnowledges
        .filter(twakeKnowledge => twakeKnowledge.display)
        .map((twakeKnowledge, index) => {
          const isSelected = openedKnowledgePanel === twakeKnowledge.id
          const numberOfSelectedItems =
            selectedTwakeKnowledge[twakeKnowledge.id].length
          return (
            <Chip
              key={twakeKnowledge.id}
              icon={
                <img src={twakeKnowledge.icon} className="u-h-1 u-ml-half" />
              }
              deleteIcon={
                numberOfSelectedItems > 0 ? (
                  <span
                    className={cx(
                      'u-flex u-flex-items-center u-flex-justify-center u-bdrs-circle u-bg-primaryColor u-white u-mr-half',
                      styles['knowledge-chips-counter']
                    )}
                  >
                    {numberOfSelectedItems}
                  </span>
                ) : null
              }
              onDelete={numberOfSelectedItems > 0 ? () => { } : null}
              label={twakeKnowledge.label}
              clickable
              variant={
                isSelected || numberOfSelectedItems > 0 ? 'ghost' : 'default'
              }
              className={cx('u-mr-0', styles['knowledge-chips-item'], {
                'u-mr-half': index < twakeKnowledges.length - 1
              })}
              onClick={() => {
                onSelectTwakeKnowledge(twakeKnowledge.id)
              }}
            />
          )
        })}
    </div>
  )
}

export default TwakeKnowledgeSelector
