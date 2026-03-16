import cx from 'classnames'
import React from 'react'

import flag from 'cozy-flags'
import Chip from 'cozy-ui/transpiled/react/Chips'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { useAssistant } from '../AssistantProvider'

const TwakeKnowledgeSelector = ({ onSelectTwakeKnowledge }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
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
      <Typography className="u-mr-half u-db-t u-dn u-fz-tiny u-coolGrey">
        {t('assistant.twake_knowledges.search_in')}
      </Typography>
      {twakeKnowledges
        .filter(twakeKnowledge => twakeKnowledge.display)
        .map((twakeKnowledge, index) => {
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
                  className="u-h-1 u-mh-half-t u-ml-half"
                />
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
              onDelete={numberOfSelectedItems > 0 ? () => {} : null}
              label={isMobile ? '' : twakeKnowledge.label}
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
