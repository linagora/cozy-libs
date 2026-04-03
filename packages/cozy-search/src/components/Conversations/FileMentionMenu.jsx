import debounce from 'lodash/debounce'
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react'

import Icon from 'cozy-ui/transpiled/react/Icon'
import List from 'cozy-ui/transpiled/react/List'
import ListItem from 'cozy-ui/transpiled/react/ListItem'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Paper from 'cozy-ui/transpiled/react/Paper'
import Popper from 'cozy-ui/transpiled/react/Popper'
import { useI18n } from 'twake-i18n'

import { useFileMention } from './FileMentionContext'
import { MENTION_REPLACE_REGEX, FILE_SEARCH_OPTIONS } from './mentionConstants'
import SuggestionItemTextHighlighted from '../ResultMenu/SuggestionItemTextHighlighted'
import { useFetchResult } from '../Search/useFetchResult'

const FileMentionMenu = ({
  anchorEl,
  searchTerm,
  composerRuntime,
  inputRef
}) => {
  const { t } = useI18n()
  const { addFile, removeMentionText, handleInputChange, menuKeyDownRef } =
    useFileMention()
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

  const replaceMentionWith = text => {
    if (composerRuntime) {
      const currentText = composerRuntime.getState().text
      const replacement = text ? `$1${text} ` : '$1'
      const newText = currentText.replace(MENTION_REPLACE_REGEX, replacement)
      composerRuntime.setText(newText)
      handleInputChange(newText)

      // Trigger height recalc (handled by ConversationBar's input listener)
      if (inputRef?.current) {
        requestAnimationFrame(() => {
          inputRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
        })
      }
    } else {
      removeMentionText()
    }
  }

  const clearMention = () => {
    replaceMentionWith('')
  }

  const handleSelect = file => {
    addFile({
      id: file.id,
      name: file.primary,
      path: file.secondary,
      icon: file.icon
    })
    const nameWithoutExt = file.primary.replace(/\.[^.]+$/, '')
    replaceMentionWith(`\u00AB${nameWithoutExt}\u00BB`)
  }

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      if (!fileResults[selectedIndex]) return
      e.preventDefault()
      handleSelect(fileResults[selectedIndex])
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

  // Register handler for input-level keyboard interception
  useLayoutEffect(() => {
    menuKeyDownRef.current = handleKeyDown
    return () => {
      menuKeyDownRef.current = null
    }
  })

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
          {isLoading && <ListItem>{t('assistant.mention.loading')}</ListItem>}
          {!isLoading && fileResults.length === 0 && (
            <ListItem>{t('assistant.mention.no_files')}</ListItem>
          )}
          {fileResults.map((file, idx) => (
            <ListItem
              key={file.id}
              button
              selected={selectedIndex === idx}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleSelect(file)}
            >
              <ListItemIcon>
                {file.icon && file.icon.type === 'component' ? (
                  <Icon icon={file.icon.component} size={32} />
                ) : (
                  file.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <SuggestionItemTextHighlighted
                    text={file.primary}
                    query={searchTerm}
                  />
                }
                secondary={
                  <SuggestionItemTextHighlighted
                    text={file.secondary}
                    query={searchTerm}
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Popper>
  )
}

export default FileMentionMenu
