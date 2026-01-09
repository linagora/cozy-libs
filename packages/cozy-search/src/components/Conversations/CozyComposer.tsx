/**
 * CozyComposer wraps cozy-ui's SearchBar with assistant-ui's composer functionality.
 *
 * Features:
 * - Multiline input with auto-height adjustment
 * - Send button with Paperplane icon
 * - Stop button during generation
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline on desktop)
 */

import React, { useRef, useCallback } from 'react'

import { useI18n } from 'twake-i18n'

import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import PaperplaneIcon from 'cozy-ui/transpiled/react/Icons/Paperplane'
import StopIcon from 'cozy-ui/transpiled/react/Icons/Stop'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import useEventListener from 'cozy-ui/transpiled/react/hooks/useEventListener'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import {
  ComposerPrimitive,
  useComposerRuntime,
  useThread,
  useComposer
} from '@assistant-ui/react'

import styles from './styles.styl'

const CozyComposer = () => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const inputRef = useRef<HTMLInputElement>(null)
  const composerRuntime = useComposerRuntime()
  const isRunning = useThread(state => state.isRunning)

  // Get reactive composer state
  const value = useComposer(state => state.text)
  const isEmpty = useComposer(state => state.isEmpty)

  // Auto-adjust input height for multiline
  useEventListener(inputRef.current, 'input', () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  })

  const handleSend = useCallback(() => {
    composerRuntime.send()
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.value = '' // Force clear the input
    }
  }, [composerRuntime])

  const handleCancel = useCallback(() => {
    composerRuntime.cancel()
  }, [composerRuntime])

  const handleKeyDown = useCallback(
    (ev: React.KeyboardEvent) => {
      if (!isMobile) {
        if (ev.shiftKey && ev.key === 'Enter') {
          return // Allow newline
        }

        if (ev.key === 'Enter') {
          ev.preventDefault()
          handleSend()
        }
      }
    },
    [isMobile, handleSend]
  )

  return (
    <ComposerPrimitive.Root className="u-w-100 u-maw-7 u-mh-auto">
      <SearchBar
        className={styles['conversationBar']}
        icon={null}
        size="auto"
        placeholder={t('assistant.search.placeholder')}
        disabledClear
        value={value}
        componentsProps={{
          inputBase: {
            inputRef: inputRef,
            className: 'u-pv-0',
            rows: 1,
            multiline: true,
            inputProps: {
              className: styles['conversationBar-input']
            },
            autoFocus: !isMobile,
            inputComponent: ComposerPrimitive.Input,
            endAdornment: isRunning ? (
              <IconButton
                size="small"
                className="u-mr-half"
                onClick={handleCancel}
                style={{
                  backgroundColor: 'var(--primaryColor)',
                  color: 'white',
                  width: 28,
                  height: 28
                }}
              >
                <Icon icon={StopIcon} size={12} />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                className="u-mr-half"
                disabled={isEmpty}
                onClick={handleSend}
                style={{
                  backgroundColor: isEmpty
                    ? 'var(--disabledBackground)'
                    : 'var(--primaryColor)',
                  color: isEmpty ? 'var(--disabledColor)' : 'white',
                  width: 28,
                  height: 28
                }}
              >
                <Icon icon={PaperplaneIcon} size={12} />
              </IconButton>
            ),
            onKeyDown: handleKeyDown
          }
        }}
      />
    </ComposerPrimitive.Root>
  )
}

export default CozyComposer
