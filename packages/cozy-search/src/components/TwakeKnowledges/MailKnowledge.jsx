import React, { useState } from 'react'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Collapse from 'cozy-ui/transpiled/react/Collapse'
import Icon from 'cozy-ui/transpiled/react/Icon'
import DropdownIcon from 'cozy-ui/transpiled/react/Icons/Dropdown'
import EmailIcon from 'cozy-ui/transpiled/react/Icons/Email'
import FileIcon from 'cozy-ui/transpiled/react/Icons/File'
import PaperplaneIcon from 'cozy-ui/transpiled/react/Icons/Paperplane'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import StarIcon from 'cozy-ui/transpiled/react/Icons/Star'
import UploadIcon from 'cozy-ui/transpiled/react/Icons/Upload'
import WarnIcon from 'cozy-ui/transpiled/react/Icons/Warn'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

const MailSection = ({
  title,
  icon,
  items,
  selectedItems,
  onToggleItem,
  onClearSection,
  showSeeMore
}) => {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleSection = () => {
    setIsOpen(!isOpen)
  }

  const selectedCount = items.filter(item =>
    selectedItems.includes(item.id)
  ).length

  return (
    <>
      <ListItem className={styles['section-header']}>
        <ListItemIcon className="u-c-pointer" onClick={handleToggleSection}>
          <Icon icon={isOpen ? DropdownIcon : RightIcon} />
        </ListItemIcon>
        <ListItemIcon>
          <Checkbox
            checked={
              items.length > 0 &&
              items.every(item => selectedItems.includes(item.id))
            }
            indeterminate={selectedCount > 0 && selectedCount < items.length}
            onClick={() => {
              const allIds = items.map(i => i.id)
              const allSelected = allIds.every(id => selectedItems.includes(id))
              if (allSelected) {
                onClearSection(allIds)
              } else {
                onToggleItem(allIds.filter(id => !selectedItems.includes(id)))
              }
            }}
          />
        </ListItemIcon>
        <ListItemIcon>
          <Icon icon={icon} />
        </ListItemIcon>
        <ListItemText primary={title} />
        {selectedCount > 0 && (
          <Button
            className={styles['clear-all-button']}
            variant="text"
            size="small"
            label={t('assistant.twake_knowledges.clear_all')}
            onClick={e => {
              e.stopPropagation()
              onClearSection(items.map(i => i.id))
            }}
          />
        )}
      </ListItem>

      <Collapse in={isOpen}>
        <List component="div" disablePadding>
          {items.map(item => (
            <ListItem
              key={item.id}
              className={styles['nested-item']}
              button
              onClick={() => onToggleItem([item.id])}
            >
              <ListItemIcon>
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText
                primary={item.subject}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    <Typography variant="caption" className="u-db" noWrap>
                      {item.from}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className={styles['mail-preview']}
                      noWrap
                    >
                      {item.preview}
                    </Typography>
                  </>
                }
              />
              <Typography
                variant="caption"
                color="textSecondary"
                className={styles['date-label']}
              >
                {item.date}
              </Typography>
            </ListItem>
          ))}
          {showSeeMore && (
            <ListItem className={styles['nested-item']}>
              <Button
                variant="text"
                size="small"
                label={t('assistant.twake_knowledges.see_more')}
              />
            </ListItem>
          )}
        </List>
      </Collapse>
    </>
  )
}

const MailKnowledge = ({ selectedItems, onToggleItems, onClearItems }) => {
  const { t, lang } = useI18n()
  const today = new Date().toLocaleDateString(lang, {
    month: 'short',
    day: 'numeric'
  })
  const inboxItems = [
    {
      id: 'inbox-1',
      subject: 'Project timeline update',
      from: 'pm@twake.app',
      preview: 'The project timeline have been updated',
      date: today
    },
    {
      id: 'inbox-2',
      subject: 'Your meeting transcript is ready!',
      from: 'noreply@linagora.com',
      preview: 'The transcript and summary of your visio meeting is ready',
      date: today
    },
    {
      id: 'inbox-3',
      subject: 'New event from Isabelle Moreau',
      from: 'imoreau@linagora.com',
      preview: 'Isabelle Moreau has invited you',
      date: today
    },
    {
      id: 'inbox-4',
      subject: 'Recap hebdomadaire OSSA',
      from: 'ossa@linagora.com',
      preview: 'Bulletin hebdomadaire OSSA',
      date: today
    }
  ]

  const starredItems = [
    {
      id: 'mail4',
      subject: 'Important: Security Update',
      from: 'security@twake.app',
      preview: 'Please update your password',
      date: today
    }
  ]

  return (
    <List>
      <MailSection
        title={t('assistant.twake_knowledges.inbox')}
        icon={EmailIcon}
        items={inboxItems}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
        showSeeMore
      />
      <MailSection
        title={t('assistant.twake_knowledges.starred')}
        icon={StarIcon}
        items={starredItems}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <MailSection
        title={t('assistant.twake_knowledges.sent')}
        icon={PaperplaneIcon}
        items={[]}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <MailSection
        title={t('assistant.twake_knowledges.draft')}
        icon={FileIcon}
        items={[]}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <MailSection
        title={t('assistant.twake_knowledges.outbox')}
        icon={UploadIcon}
        items={[]}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <MailSection
        title={t('assistant.twake_knowledges.spam')}
        icon={WarnIcon}
        items={[]}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
    </List>
  )
}

export default MailKnowledge
