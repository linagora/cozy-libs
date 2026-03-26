import React, { useState, useMemo, useEffect, useCallback } from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Spinner from 'cozy-ui/transpiled/react/Spinner'

import { useFileMention } from './FileMentionContext'
import { useFetchResult } from '../Search/useFetchResult'

const FileMentionMenu = ({ anchorRef, searchTerm, onClose }) => {
  const { addFile } = useFileMention()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const { isLoading, results } = useFetchResult(searchTerm, {
    doctype: 'io.cozy.files'
  })

  const fileResults = useMemo(
    () => results?.filter(r => r.slug === 'drive' || r.id) || [],
    [results]
  )

  // Reset selection when search term changes
  const [prevSearchTerm, setPrevSearchTerm] = useState(searchTerm)
  if (searchTerm !== prevSearchTerm) {
    setPrevSearchTerm(searchTerm)
    setSelectedIndex(0)
  }

  const handleSelect = useCallback(
    file => {
      addFile({
        id: file.id,
        name: file.primary,
        path: file.secondary,
        icon: file.icon
      })
      onClose()
    },
    [addFile, onClose]
  )

  const handleKeyDown = useCallback(
    e => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        if (fileResults[selectedIndex]) {
          handleSelect(fileResults[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < fileResults.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
      }
    },
    [fileResults, selectedIndex, handleSelect, onClose]
  )

  useEffect(() => {
    const el = anchorRef?.current
    if (el) {
      el.addEventListener('keydown', handleKeyDown)
      return () => el.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, handleKeyDown])

  return (
    <Paper
      elevation={3}
      className="u-overflow-y-auto"
      style={{
        maxHeight: '300px',
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        zIndex: 10
      }}
    >
      <List>
        {isLoading && (
          <ListItem>
            <Spinner size="small" className="u-mr-half" />
            <ListItemText primary="Loading..." />
          </ListItem>
        )}
        {!isLoading && fileResults.length === 0 && (
          <ListItem>
            <ListItemText primary="No files found" />
          </ListItem>
        )}
        {fileResults.map((file, idx) => (
          <ListItem
            key={file.id}
            button
            selected={selectedIndex === idx}
            onClick={() => handleSelect(file)}
          >
            {file.icon && file.icon.type === 'component' && (
              <ListItemIcon>
                <Icon icon={file.icon.component} size={32} />
              </ListItemIcon>
            )}
            <ListItemText primary={file.primary} secondary={file.secondary} />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}

export default FileMentionMenu
