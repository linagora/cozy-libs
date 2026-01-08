import React from 'react'

import flag from 'cozy-flags'
import Chip from 'cozy-ui/transpiled/react/Chips'

import AssistantSelection from './AssistantSelection'
import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'
import { useAssistant } from '../AssistantProvider'

const TwakeKnowledgeSelector = ({ onSelectTwakeKnowledge }) => {
  const { openedKnowledgePanel, selectedTwakeKnowledge } = useAssistant()
  const twakeKnowledges = [
    {
      id: 'chat',
      label: 'Chat',
      display: flag('cozy.assistant.demo'),
      icon: TChat
    },
    { id: 'drive', label: 'Drive', display: true, icon: TDrive },
    { id: 'mail', label: 'Mail', display: true, icon: TMail }
  ]

  return (
    <div
      className={`u-flex u-flex-row u-flex-wrap u-flex-items-center u-flex-justify-end u-mb-1 ${styles['conversation-chips-container']}`}
    >
      {twakeKnowledges
        .filter(twakeKnowledge => twakeKnowledge.display)
        .map(twakeKnowledge => {
          const isSelected = openedKnowledgePanel === twakeKnowledge.id
          const numberOfSelectedItems =
            selectedTwakeKnowledge[twakeKnowledge.id].length
          return (
            <Chip
              key={twakeKnowledge.id}
              icon={
                <img
                  src={twakeKnowledge.icon}
                  className={styles['conversation-chips-icon']}
                />
              }
              deleteIcon={
                numberOfSelectedItems > 0 ? (
                  <span className={styles['conversation-chips-counter']}>
                    {numberOfSelectedItems}
                  </span>
                ) : null
              }
              onDelete={numberOfSelectedItems > 0 ? () => {} : null}
              label={twakeKnowledge.label}
              clickable
              variant={
                isSelected || numberOfSelectedItems > 0 ? 'ghost' : 'default'
              }
              className={styles['conversation-chips-item']}
              onClick={() => {
                onSelectTwakeKnowledge(twakeKnowledge.id)
              }}
            />
          )
        })}
    </div>
  )
}

const ChatModes = ({ onCreateAssistant, onSelectTwakeKnowledge }) => {
  return (
    <div className="u-flex u-flex-row u-flex-justify-between u-maw-7 u-w-100 u-mb-1">
      <AssistantSelection
        assistants={[]}
        selectedAssistant={null}
        onSelect={() => {}}
        onCreate={onCreateAssistant}
      />
      <TwakeKnowledgeSelector onSelectTwakeKnowledge={onSelectTwakeKnowledge} />
    </div>
  )
}

export default ChatModes
