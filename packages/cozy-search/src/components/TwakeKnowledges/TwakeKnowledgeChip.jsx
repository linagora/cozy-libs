import cx from 'classnames'
import React from 'react'

import Chip from 'cozy-ui/transpiled/react/Chips'
import Icon from 'cozy-ui/transpiled/react/Icon'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from './styles.styl'
import { useAssistant } from '../AssistantProvider'

const CHIP_CLASSES = {
  label: 'u-p-0',
  icon: 'u-m-0'
}

const TwakeKnowledgeChip = ({ twakeKnowledge, isLast, onSelect }) => {
  const { isMobile } = useBreakpoints()
  const {
    openedKnowledgePanel,
    selectedTwakeKnowledge,
    setSelectedTwakeKnowledge
  } = useAssistant()

  const isPanelOpen = openedKnowledgePanel === twakeKnowledge.id
  const hasSelection = selectedTwakeKnowledge[twakeKnowledge.id].length > 0
  const isActive = isPanelOpen || hasSelection
  const isPill = !isMobile || hasSelection

  const handleClear = () => {
    setSelectedTwakeKnowledge(prev => ({ ...prev, [twakeKnowledge.id]: [] }))
  }

  return (
    <Chip
      aria-label={twakeKnowledge.label}
      icon={
        <img
          alt=""
          aria-hidden="true"
          src={twakeKnowledge.icon}
          className={styles['knowledge-chips-icon']}
        />
      }
      deleteIcon={
        hasSelection ? (
          <Icon
            icon={CrossIcon}
            size={16}
            style={{
              height: 16,
              width: 16,
              marginLeft: 10,
              marginRight: 0
            }}
            color="var(--primaryColor)"
          />
        ) : undefined
      }
      onDelete={hasSelection ? handleClear : undefined}
      label={isMobile ? '' : twakeKnowledge.label}
      clickable
      variant={isActive ? 'ghost' : 'default'}
      classes={
        isMobile
          ? CHIP_CLASSES
          : { label: 'u-pl-half u-fz-tiny', icon: 'u-m-0' }
      }
      className={cx('u-mr-0', {
        'u-w-auto u-ph-half': isPill,
        'u-mr-half': !isLast
      })}
      onClick={() => onSelect(twakeKnowledge.id)}
    />
  )
}

export default TwakeKnowledgeChip
