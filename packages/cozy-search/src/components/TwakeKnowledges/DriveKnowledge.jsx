import React, { useState } from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Checkbox from 'cozy-ui/transpiled/react/Checkbox'
import Collapse from 'cozy-ui/transpiled/react/Collapse'
import Icon from 'cozy-ui/transpiled/react/Icon'
import DropdownIcon from 'cozy-ui/transpiled/react/Icons/Dropdown'
import FolderIcon from 'cozy-ui/transpiled/react/Icons/FileTypeFolder'
import RightIcon from 'cozy-ui/transpiled/react/Icons/Right'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'

import styles from './styles.styl'

const DriveSection = ({
  title,
  items,
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
  const customItems = items.filter(
    item => !['my-drive', 'shared-with-me'].includes(item.id)
  )

  return (
    <>
      <ListItem className={styles['section-header']}>
        <ListItemIcon className="u-c-pointer" onClick={handleToggleSection}>
          <Icon icon={isOpen ? DropdownIcon : RightIcon} />
        </ListItemIcon>
        <ListItemIcon>
          <Checkbox
            checked={
              items.every(item => selectedItems.includes(item.id)) &&
              items.length > 0
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
          <Icon icon={FolderIcon} className={styles['section-icon']} />
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
          {customItems.map(item => (
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
              <ListItemIcon>
                <Icon icon={FolderIcon} color="var(--primaryColor)" />
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  )
}

const DriveKnowledge = ({ selectedItems, onToggleItems, onClearItems }) => {
  const { t } = useI18n()
  const myDriveItems = [
    { id: 'doc1', name: 'Documents' },
    { id: 'proj1', name: 'Projects' },
    { id: 'img1', name: 'Images' }
  ]

  const sharedItems = [{ id: 'shared-doc', name: 'Documents' }]

  return (
    <List>
      <DriveSection
        title={t('assistant.twake_knowledges.my_drive')}
        items={myDriveItems}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <DriveSection
        title={t('assistant.twake_knowledges.shared_with_me')}
        items={sharedItems}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
    </List>
  )
}

export default DriveKnowledge
