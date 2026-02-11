import { useComposerRuntime } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useState, useEffect } from 'react'
import { useI18n } from 'twake-i18n'

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
  const { t } = useI18n()
  const {
    openedKnowledgePanel,
    selectedTwakeKnowledge,
    setSelectedTwakeKnowledge
  } = useAssistant()
  const composerRuntime = useComposerRuntime()
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
    composerRuntime.setRunConfig({
      custom: {
        sources: {
          ...selectedTwakeKnowledge,
          [openedKnowledgePanel]: selectedItems
        }
      }
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
        return t('assistant.twake_knowledges.title_drive')
      case 'mail':
        return t('assistant.twake_knowledges.title_mail')
      case 'chat':
        return t('assistant.twake_knowledges.title_chat')
      default:
        return t('assistant.twake_knowledges.title_default')
    }
  }

  const getDescription = () => {
    switch (openedKnowledgePanel) {
      case 'drive':
        return t('assistant.twake_knowledges.desc_drive')
      case 'mail':
        return t('assistant.twake_knowledges.desc_mail')
      case 'chat':
        return t('assistant.twake_knowledges.desc_chat')
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
        <SearchBar
          placeholder={t('assistant.twake_knowledges.search_placeholder')}
          size="small"
        />
      </div>

      <div className={styles['source-panel-content']}>{renderContent()}</div>

      <div className={styles['source-panel-footer']}>
        <div className="u-flex u-flex-justify-between u-flex-items-end u-flex-gap-half">
          <Typography variant="caption" className="u-mb-half">
            {t('assistant.twake_knowledges.items_selected', {
              smart_count: selectedItems.length
            })}
          </Typography>
          <Button
            variant="secondary"
            label={
              selectedItems.length > 0
                ? t('assistant.twake_knowledges.clear_all')
                : t('assistant.twake_knowledges.cancel')
            }
            onClick={selectedItems.length > 0 ? handleClearAll : onClose}
          />
          <Button
            variant="primary"
            label={
              openedKnowledgePanel === 'drive'
                ? t('assistant.twake_knowledges.select_folders')
                : openedKnowledgePanel === 'mail'
                ? t('assistant.twake_knowledges.select_emails')
                : t('assistant.twake_knowledges.select_messages')
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
