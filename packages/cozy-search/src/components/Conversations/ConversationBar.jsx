import { ComposerPrimitive } from '@assistant-ui/react'
import React, { useRef } from 'react'
import { useI18n } from 'twake-i18n'

import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import PaperplaneIcon from 'cozy-ui/transpiled/react/Icons/Paperplane'
import StopIcon from 'cozy-ui/transpiled/react/Icons/Stop'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import useEventListener from 'cozy-ui/transpiled/react/hooks/useEventListener'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import styles from './styles.styl'

const ConversationBar = ({
  value,
  isEmpty,
  isRunning,
  onKeyDown,
  onSend,
  onCancel
}) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const inputRef = useRef()

  // to adjust input height for multiline when typing in it
  useEventListener(inputRef.current, 'input', () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  })

  const handleSend = () => {
    if (isEmpty) return

    onSend()
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = e => {
    if (isEmpty) return

    onKeyDown(e)
  }

  return (
    <div className="u-w-100 u-maw-7 u-mh-auto">
      <SearchBar
        className={styles['conversationBar']}
        icon={null}
        size="auto"
        placeholder={t('assistant.search.placeholder')}
        value={value}
        disabledClear
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
              <IconButton className="u-p-0 u-mr-half">
                <Button
                  size="small"
                  component="div"
                  className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
                  classes={{ label: 'u-flex u-w-auto' }}
                  label={<Icon icon={StopIcon} size={12} />}
                  onClick={onCancel}
                />
              </IconButton>
            ) : (
              <IconButton className="u-p-0 u-mr-half">
                <Button
                  size="small"
                  component="div"
                  className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
                  classes={{ label: 'u-flex u-w-auto' }}
                  label={<Icon icon={PaperplaneIcon} size={12} rotate={-45} />}
                  disabled={isEmpty}
                  onClick={handleSend}
                />
              </IconButton>
            ),
            onKeyDown: handleKeyDown
          }
        }}
      />
    </div>
  )
}

export default ConversationBar
