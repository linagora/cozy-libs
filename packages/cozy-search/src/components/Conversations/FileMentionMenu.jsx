import React, { useCallback, useEffect, useState } from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Popper from 'cozy-ui/transpiled/react/Popper'
import { useI18n } from 'twake-i18n'

import { useFetchResult } from '../Search/useFetchResult'
import { useFileMention } from './FileMentionContext'

const MENTION_REPLACE_REGEX = /(^|\s)@[\w. ]*$/

const FILE_SEARCH_OPTIONS = {
  doctypes: ['io.cozy.files'],
  excludeFilters: { type: 'directory' }
}

const FileMentionMenu = ({ anchorEl, searchTerm, composerRuntime, keyDownHandlerRef }) => {
  const { t } = useI18n()
  const { addFile, handleInputChange } = useFileMention()
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 250)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const shouldSearch = debouncedSearchTerm.length > 0
  const { isLoading, results } = useFetchResult(
    shouldSearch ? debouncedSearchTerm : null,
    FILE_SEARCH_OPTIONS
  )

  const fileResults = results ? results.filter(r => r.type !== 'directory') : []

  useEffect(() => {
    setHighlightedIndex(0)
  }, [fileResults.length])

  const clearMention = useCallback(() => {
    const currentText = composerRuntime.getState().text
    const newText = currentText.replace(MENTION_REPLACE_REGEX, '$1')
    composerRuntime.setText(newText)
    handleInputChange(newText)
  }, [composerRuntime, handleInputChange])

  const handleSelect = useCallback(
    result => {
      addFile({
        id: result.id,
        name: result.primary,
        path: result.secondary,
        icon: result.icon
      })
      clearMention()
    },
    [addFile, clearMention]
  )

  useEffect(() => {
    if (!keyDownHandlerRef) return
    keyDownHandlerRef.current = e => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, fileResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (fileResults[highlightedIndex]) {
          e.preventDefault()
          handleSelect(fileResults[highlightedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        clearMention()
      }
    }
  })

  return (
    <Popper
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      placement="top-start"
      style={{ zIndex: 'var(--zIndex-popover)' }}
    >
      <Paper square style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <List>
          {!shouldSearch && (
            <ListItem>
              <ListItemText primary={t('assistant.fileMention.typeToSearch')} />
            </ListItem>
          )}
          {shouldSearch && isLoading && (
            <ListItem>
              <ListItemText primary={t('assistant.fileMention.loading')} />
            </ListItem>
          )}
          {shouldSearch && !isLoading && fileResults.length === 0 && (
            <ListItem>
              <ListItemText primary={t('assistant.fileMention.noResults')} />
            </ListItem>
          )}
          {shouldSearch &&
            !isLoading &&
            fileResults.map((result, idx) => {
              const iconEl =
                result.icon && result.icon.type === 'component' ? (
                  <Icon icon={result.icon.component} size={32} />
                ) : null

              return (
                <ListItem
                  key={result.id}
                  button
                  selected={idx === highlightedIndex}
                  onClick={() => handleSelect(result)}
                >
                  {iconEl && <ListItemIcon>{iconEl}</ListItemIcon>}
                  <ListItemText
                    primary={result.primary}
                    secondary={result.secondary}
                  />
                </ListItem>
              )
            })}
        </List>
      </Paper>
    </Popper>
  )
}

export default FileMentionMenu
