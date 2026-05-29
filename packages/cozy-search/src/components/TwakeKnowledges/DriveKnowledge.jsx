import React, { useState } from 'react'

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
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

// Dummy children used to simulate that each folder holds more content.
const MY_DRIVE_SUBFOLDERS = ['Archive', 'Documents', 'Meetings']
const SHARED_SUBFOLDERS = ['Documents', 'Reports', 'Archive']

const makeChildren = (parentId, subfolderNames) =>
  subfolderNames.map(name => ({
    id: `${parentId}-${name.toLowerCase()}`,
    name
  }))

const makeFolders = (names, subfolderNames, prefix = '') =>
  names.map(name => {
    const id = `${prefix}${name.toLowerCase().replace(/\s+/g, '-')}`
    return { id, name, children: makeChildren(id, subfolderNames) }
  })

const MY_DRIVE_FOLDERS = makeFolders(
  ['Admin', 'Business', 'HR', 'Legal', 'Perso', 'Projects', 'Tech'],
  MY_DRIVE_SUBFOLDERS
)

const SHARED_FOLDERS = makeFolders(
  ['Design', 'Marketing', 'Sales'],
  SHARED_SUBFOLDERS,
  'shared-'
)

const flattenIds = nodes =>
  nodes.reduce(
    (ids, node) => ids.concat(node.id, flattenIds(node.children || [])),
    []
  )

const DriveTreeItem = ({ item, depth, selectedItems, onToggleItem }) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  return (
    <>
      <ListItem
        button
        className={styles['drive-tree-item']}
        style={{ paddingLeft: `${2 + depth * 1.5}rem` }}
        onClick={() => onToggleItem([item.id])}
      >
        <ListItemIcon
          className="u-c-pointer"
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          onClick={e => {
            e.stopPropagation()
            if (hasChildren) setIsOpen(open => !open)
          }}
        >
          <Icon icon={isOpen ? DropdownIcon : RightIcon} />
        </ListItemIcon>
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

      {hasChildren && (
        <Collapse in={isOpen} unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map(child => (
              <DriveTreeItem
                key={child.id}
                item={child}
                depth={depth + 1}
                selectedItems={selectedItems}
                onToggleItem={onToggleItem}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

const DriveSection = ({
  title,
  folders,
  selectedItems,
  onToggleItem,
  onClearSection
}) => {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const allIds = flattenIds(folders)
  const selectedCount = allIds.filter(id => selectedItems.includes(id)).length
  const allSelected = allIds.length > 0 && selectedCount === allIds.length

  return (
    <>
      <ListItem className={styles['section-header']}>
        <ListItemIcon
          className="u-c-pointer"
          onClick={() => setIsOpen(open => !open)}
        >
          <Icon icon={isOpen ? DropdownIcon : RightIcon} />
        </ListItemIcon>
        <ListItemIcon>
          <Checkbox
            checked={allSelected}
            indeterminate={selectedCount > 0 && !allSelected}
            onClick={() => {
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
              onClearSection(allIds)
            }}
          />
        )}
      </ListItem>

      <Collapse in={isOpen}>
        <List component="div" disablePadding>
          {folders.map(folder => (
            <DriveTreeItem
              key={folder.id}
              item={folder}
              depth={0}
              selectedItems={selectedItems}
              onToggleItem={onToggleItem}
            />
          ))}
        </List>
      </Collapse>
    </>
  )
}

const DriveKnowledge = ({ selectedItems, onToggleItems, onClearItems }) => {
  const { t } = useI18n()

  return (
    <List>
      <DriveSection
        title={t('assistant.twake_knowledges.my_drive')}
        folders={MY_DRIVE_FOLDERS}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
      <DriveSection
        title={t('assistant.twake_knowledges.shared_with_me')}
        folders={SHARED_FOLDERS}
        selectedItems={selectedItems}
        onToggleItem={onToggleItems}
        onClearSection={onClearItems}
      />
    </List>
  )
}

export default DriveKnowledge
