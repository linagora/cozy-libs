import cx from 'classnames'
import React from 'react'

import { Icon, Cross } from '@linagora/twake-icons'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from './styles.styl'
import { useAssistant } from '../AssistantProvider'

const CHIP_CLASSES = {
  label: 'u-p-0',
  icon: 'u-m-0'
}

/**
 * Source chip rendered as an all-or-nothing toggle: clicking the chip (or its
 * cross) selects/deselects the whole source. No picker panel — selection is
 * demo-only UI, not sent to the backend.
 */
const TwakeKnowledgeChip = ({ twakeKnowledge, isLast }) => {
  const { isMobile } = useBreakpoints()
  const { selectedTwakeKnowledge, setSelectedTwakeKnowledge } = useAssistant()

  const isSelected = selectedTwakeKnowledge[twakeKnowledge.id] !== false
  const isPill = !isMobile || isSelected

  const toggle = () =>
    setSelectedTwakeKnowledge(prev => ({
      ...prev,
      [twakeKnowledge.id]: !isSelected
    }))

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
        isSelected ? (
          <Icon
            icon={Cross}
            size={10}
            style={{ height: 10, width: 10, marginLeft: 6, marginRight: 0 }}
            color="var(--primaryColor)"
          />
        ) : undefined
      }
      onDelete={isSelected ? toggle : undefined}
      label={isMobile ? '' : twakeKnowledge.label}
      clickable
      variant={isSelected ? 'ghost' : 'default'}
      classes={
        isMobile
          ? CHIP_CLASSES
          : { label: 'u-pl-half u-fz-tiny', icon: 'u-m-0' }
      }
      className={cx('u-mr-0', {
        'u-w-auto u-ph-half': isPill,
        'u-mr-half': !isLast
      })}
      onClick={toggle}
    />
  )
}

export default TwakeKnowledgeChip
