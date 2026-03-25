import debounce from 'lodash/debounce'
import React, { useEffect, useRef, useState } from 'react'

import {
  Popper,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from 'cozy-ui/transpiled/react'
import Icon from 'cozy-ui/transpiled/react/Icon'

import { useFileMention } from './FileMentionContext'
import { useFetchResult } from '../Search/useFetchResult'

const FileMentionMenu = ({ anchorEl, searchTerm }) => {
  const { addFile, removeMentionText } = useFileMention()
  const listRef = useRef()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  useEffect(() => {
    const debounced = debounce(setDebouncedSearchTerm, 250)
    debounced(searchTerm)
    return () => debounced.cancel()
  }, [searchTerm])

  const { isLoading, results } = useFetchResult(debouncedSearchTerm)

  const fileResults =
    results?.filter(r => r.doc?._type === 'io.cozy.files') || []

  const handleSelect = file => {
    addFile({
      id: file.id,
      name: file.primary,
      path: file.secondary,
      icon: file.icon
    })
    removeMentionText()
  }

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      removeMentionText()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < fileResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex])
      }
    }
  }

  return (
    <Popper
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      placement="bottom-start"
      style={{ zIndex: 'var(--zIndex-popover)' }}
    >
      <Paper
        square
        className="u-overflow-y-auto"
        style={{ maxHeight: '300px' }}
      >
        <List ref={listRef}>
          {isLoading && <ListItem>Loading...</ListItem>}
          {!isLoading && fileResults.length === 0 && (
            <ListItem>No files found</ListItem>
          )}
          {fileResults.map((file, idx) => (
            <ListItem
              key={file.id}
              button
              selected={selectedIndex === idx}
              onClick={() => handleSelect(file)}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              <ListItemIcon>
                {file.icon && file.icon.type === 'component' ? (
                  <Icon icon={file.icon.component} size={32} />
                ) : (
                  file.icon
                )}
              </ListItemIcon>
              <ListItemText primary={file.primary} secondary={file.secondary} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Popper>
  )
}

export default FileMentionMenu
