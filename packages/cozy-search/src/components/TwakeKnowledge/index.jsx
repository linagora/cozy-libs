import cx from 'classnames'
import React, { useState, useEffect } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'

import { useAssistant } from '../AssistantProvider'
import ChatKnowledge from './ChatKnowledge'
import DriveKnowledge from './DriveKnowledge'
import MailKnowledge from './MailKnowledge'
import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'

const TwakeKnowledgePanel = ({ onClose }) => {
  const {
    openedKnowledgePanel,
    selectedTwakeKnowledge,
    setSelectedTwakeKnowledge
  } = useAssistant()
  const [selectedItems, setSelectedItems] = useState([])

  useEffect(() => {
    setSelectedItems(selectedTwakeKnowledge[openedKnowledgePanel] || [])
  }, [openedKnowledgePanel, selectedTwakeKnowledge])

  const handleToggleItems = ids => {
    const allSelected = ids.every(id => selectedItems.includes(id))
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...ids])])
    }
  }

  const handleClearItems = ids => {
    setSelectedItems(prev => prev.filter(id => !ids.includes(id)))
  }

  const handleClearAll = () => {
    setSelectedItems([])
  }

  const handleConfirm = () => {
    setSelectedTwakeKnowledge({
      ...selectedTwakeKnowledge,
      [openedKnowledgePanel]: selectedItems
    })
    onClose()
  }

  const renderContent = () => {
    switch (openedKnowledgePanel) {
      case 'drive':
        return (
          <DriveKnowledge
            selectedItems={selectedItems}
            onToggleItems={handleToggleItems}
            onClearItems={handleClearItems}
          />
        )
      case 'mail':
        return (
          <MailKnowledge
            selectedItems={selectedItems}
            onToggleItems={handleToggleItems}
            onClearItems={handleClearItems}
          />
        )
      case 'chat':
        return (
          <ChatKnowledge
            selectedItems={selectedItems}
            onToggleItems={handleToggleItems}
            onClearItems={handleClearItems}
          />
        )
      default:
        return null
    }
  }

  const getTitle = () => {
    switch (openedKnowledgePanel) {
      case 'drive':
        return 'Select Drive folders'
      case 'mail':
        return 'Select Mail sources'
      case 'chat':
        return 'Select Chat sources'
      default:
        return 'Select sources'
    }
  }

  const getDescription = () => {
    switch (openedKnowledgePanel) {
      case 'drive':
        return 'Selected items will be used to answer your questions.'
      case 'mail':
        return 'Selected emails will be used to answer your questions.'
      case 'chat':
        return 'Selected messages will be used to answer your questions.'
      default:
        return ''
    }
  }

  const getIcon = () => {
    switch (openedKnowledgePanel) {
      case 'drive':
        return TDrive
      case 'mail':
        return TMail
      case 'chat':
        return TChat
      default:
        return null
    }
  }

  if (!openedKnowledgePanel) return null

  return (
    <div className={cx(styles['source-panel'], 'u-h-100')}>
      <div className={styles['source-panel-header']}>
        <Typography variant="h4" className="u-flex u-flex-items-center">
          <img src={getIcon()} className="u-mr-1" />
          {getTitle()}
        </Typography>
        <IconButton onClick={onClose}>
          <Icon icon={CrossIcon} />
        </IconButton>
      </div>

      <div className={styles['source-panel-description']}>
        <Typography variant="body2" color="textSecondary">
          {getDescription()}
        </Typography>
      </div>

      <div className={styles['source-panel-search']}>
        <SearchBar placeholder="Search" size="small" />
      </div>

      <div className={styles['source-panel-content']}>{renderContent()}</div>

      <div className={styles['source-panel-footer']}>
        <div className="u-flex u-flex-justify-between u-flex-items-end u-flex-gap-half">
          <Typography variant="caption" className="u-mb-half">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}{' '}
            selected
          </Typography>
          <Button
            variant="secondary"
            label={selectedItems.length > 0 ? 'Clear all' : 'Cancel'}
            onClick={selectedItems.length > 0 ? handleClearAll : onClose}
          />
          <Button
            variant="primary"
            label={
              openedKnowledgePanel === 'drive'
                ? 'Select folders'
                : openedKnowledgePanel === 'mail'
                ? 'Select emails'
                : 'Select messages'
            }
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
          />
        </div>
      </div>
    </div>
  )
}

export default TwakeKnowledgePanel
