import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { useAssistant } from '../AssistantProvider'

const CHIP_CLASSES = { label: 'u-p-0', icon: 'u-m-0' }

const TwakeKnowledgeSelector = ({ className, onSelectTwakeKnowledge }) => {
  const { t } = useI18n()
  const { openedKnowledgePanel, selectedTwakeKnowledge } = useAssistant()
  const twakeKnowledges = [
    {
      id: 'chat',
      label: t('assistant.twake_knowledges.chat'),
      display: flag('cozy.assistant.source-knowledge.chat.enabled'),
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
  ].filter(twakeKnowledge => twakeKnowledge.display)

  return (
    <div
      className={cx(
        'u-flex u-flex-row u-flex-wrap u-flex-items-center u-flex-justify-end',
        className
      )}
    >
      <Typography className="u-mr-half u-fz-tiny u-coolGrey">
        {t('assistant.twake_knowledges.search_in')}
      </Typography>
      {twakeKnowledges.map((twakeKnowledge, index) => {
        const isSelected = openedKnowledgePanel === twakeKnowledge.id
        const numberOfSelectedItems =
          selectedTwakeKnowledge[twakeKnowledge.id].length
        return (
          <Chip
            aria-label={twakeKnowledge.label}
            key={twakeKnowledge.id}
            icon={
              <img
                alt=""
                aria-hidden="true"
                src={twakeKnowledge.icon}
                className={styles['knowledge-chips-icon']}
              />
            }
            deleteIcon={
              numberOfSelectedItems > 0 ? (
                <span
                  className={cx(
                    'u-flex u-flex-items-center u-flex-justify-center u-bdrs-circle u-bg-primaryColor u-white',
                    styles['knowledge-chips-counter']
                  )}
                >
                  {numberOfSelectedItems}
                </span>
              ) : null
            }
            onDelete={numberOfSelectedItems > 0 ? () => {} : null}
            label=""
            clickable
            variant={
              isSelected || numberOfSelectedItems > 0 ? 'ghost' : 'default'
            }
            classes={CHIP_CLASSES}
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
