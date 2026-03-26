import debounce from 'lodash/debounce'
import React, { useEffect, useMemo, useState } from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Popper from 'cozy-ui/transpiled/react/Popper'
import { useFileMention } from './FileMentionContext'
import { MENTION_REPLACE_REGEX, FILE_SEARCH_OPTIONS } from './mentionConstants'
import { useFetchResult } from '../Search/useFetchResult'

const FileMentionMenu = ({ anchorEl, searchTerm, composerRuntime }) => {
  const { addFile, removeMentionText, handleInputChange } = useFileMention()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  const debouncedSearch = useMemo(
    () => debounce(setDebouncedSearchTerm, 250),
    []
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => debouncedSearch.cancel()
  }, [searchTerm, debouncedSearch])

  const { isLoading, results } = useFetchResult(
    debouncedSearchTerm,
    FILE_SEARCH_OPTIONS
  )

  const fileResults = results || []

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSelectedIndex(0), [debouncedSearchTerm])

  const clearMention = () => {
    if (composerRuntime) {
      const currentText = composerRuntime.getState().text
      const newText = currentText.replace(MENTION_REPLACE_REGEX, '$1')
      composerRuntime.setText(newText)
      handleInputChange(newText)
    } else {
      removeMentionText()
    }
  }

  const handleSelect = file => {
    addFile({
      id: file.id,
      name: file.primary,
      path: file.secondary,
      icon: file.icon
    })
    clearMention()
  }

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (fileResults[selectedIndex]) {
        handleSelect(fileResults[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      clearMention()
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
        style={{ maxHeight: '300px', overflow: 'auto' }}
      >
        <List>
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
