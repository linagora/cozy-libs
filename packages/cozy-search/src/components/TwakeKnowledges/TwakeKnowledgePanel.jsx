import cx from 'classnames'
import React, { useState, useEffect } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Dialog from 'cozy-ui/transpiled/react/Dialog'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import CrossIcon from 'cozy-ui/transpiled/react/Icons/Cross'
import Paper from 'cozy-ui/transpiled/react/Paper'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import { useAssistant } from '../AssistantProvider'
import ChatKnowledge from './ChatKnowledge'
import DriveKnowledge from './DriveKnowledge'
import MailKnowledge from './MailKnowledge'
import styles from './styles.styl'
import TChat from '../../assets/tchat.png'
import TDrive from '../../assets/tdrive.png'
import TMail from '../../assets/tmail.png'

const PANEL_CONFIG = {
  drive: {
    title: 'assistant.twake_knowledges.title_drive',
    desc: 'assistant.twake_knowledges.desc_drive',
    icon: TDrive,
    Component: DriveKnowledge,
    actionLabel: 'assistant.twake_knowledges.select_folders'
  },
  mail: {
    title: 'assistant.twake_knowledges.title_mail',
    desc: 'assistant.twake_knowledges.desc_mail',
    icon: TMail,
    Component: MailKnowledge,
    actionLabel: 'assistant.twake_knowledges.select_emails'
  },
  chat: {
    title: 'assistant.twake_knowledges.title_chat',
    desc: 'assistant.twake_knowledges.desc_chat',
    icon: TChat,
    Component: ChatKnowledge,
    actionLabel: 'assistant.twake_knowledges.select_messages'
  }
}

const TwakeKnowledgePanelContainer = ({ children, isMobile }) =>
  !isMobile ? (
    <Paper
      elevation={0}
      square={true}
      className={cx(styles['source-panel'], 'u-h-100')}
    >
      {children}
    </Paper>
  ) : (
    <Dialog fullScreen open>
      {children}
    </Dialog>
  )

const TwakeKnowledgePanel = ({ onClose }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const {
    openedKnowledgePanel,
    selectedTwakeKnowledge,
    setSelectedTwakeKnowledge
  } = useAssistant()
  const [selectedItems, setSelectedItems] = useState([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const config = PANEL_CONFIG[openedKnowledgePanel]

  if (!openedKnowledgePanel || !config) return null

  const { title, desc, icon: IconImg, Component, actionLabel } = config

  if (!openedKnowledgePanel) return null

  return (
    <TwakeKnowledgePanelContainer isMobile={isMobile}>
      <div className={styles['source-panel-header']}>
        <Typography variant="h4" className="u-flex u-flex-items-center">
          <img src={IconImg} alt="" className="u-mr-1" />
          {t(title)}
        </Typography>
        <IconButton onClick={onClose}>
          <Icon icon={CrossIcon} />
        </IconButton>
      </div>

      <div className={styles['source-panel-description']}>
        <Typography variant="body2" color="textSecondary">
          {t(desc)}
        </Typography>
      </div>

      <div className={styles['source-panel-search']}>
        <SearchBar
          placeholder={t('assistant.twake_knowledges.search_placeholder')}
          size="small"
        />
      </div>

      <div className={styles['source-panel-content']}>
        <Component
          selectedItems={selectedItems}
          onToggleItems={handleToggleItems}
          onClearItems={handleClearItems}
        />
      </div>

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
            label={t(actionLabel)}
            onClick={handleConfirm}
            disabled={selectedItems.length === 0}
          />
        </div>
      </div>
    </TwakeKnowledgePanelContainer>
  )
}

export default TwakeKnowledgePanel
