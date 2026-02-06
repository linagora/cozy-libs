import React, { useState } from 'react'
import { useI18n } from 'twake-i18n'

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

import styles from './styles.styl'

const MailSection = ({
  title,
  icon,
  items,
  count,
  selectedItems,
  onToggleItem,
  onClearSection
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
        <ListItemText
          primary={
            <div className="u-flex u-flex-items-center">
              <span>{title}</span>
              {count && <span className={styles['badge']}>{count}</span>}
            </div>
          }
        />
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
                secondary={
                  <div>
                    <Typography variant="caption" className="u-db">
                      {item.from}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="u-text-ellipsis"
                    >
                      {item.preview}
                    </Typography>
                  </div>
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
        </List>
      </Collapse>
    </>
  )
}

const MailKnowledge = ({ selectedItems, onToggleItems, onClearItems }) => {
  const { t } = useI18n()
  const inboxItems = [
    {
      id: 'mail1',
      subject: 'Q4 Budget Review Meetings',
      from: 'finance@twake.app',
      preview: 'Please review the attached budget',
      date: 'Jan 15'
    },
    {
      id: 'mail2',
      subject: 'Project Timeline Update',
      from: 'pm@twake.app',
      preview: 'The project timeline has been update',
      date: 'Jan 14'
    },
    {
      id: 'mail3',
      subject: 'Team Meeting Notes',
      from: 'team@twake.app',
      preview: "Here are the notes from yesterday's",
      date: 'Jan 13'
    }
  ]

  const starredItems = [
    {
      id: 'mail4',
      subject: 'Important: Security Update',
      from: 'security@twake.app',
      preview: 'Please update your password',
      date: 'Jan 12'
    }
  ]

  return (
    <List>
      <MailSection
        title={t('assistant.twake_knowledges.inbox')}
        icon={EmailIcon}
        count={3}
        items={inboxItems}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
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
