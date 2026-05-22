import { ComposerPrimitive } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useRef } from 'react'

import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import useEventListener from 'cozy-ui/transpiled/react/hooks/useEventListener'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

const ConversationBar = ({ value, isEmpty, onKeyDown, ...props }) => {
  const { t } = useI18n()
  const { isMobile } = useBreakpoints()
  const inputRef = useRef()

  // to adjust input height for multiline when typing in it
  // eslint-disable-next-line react-hooks/refs
  useEventListener(inputRef.current, 'input', () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  })

  const handleKeyDown = e => {
    if (isEmpty) return

    onKeyDown(e)
  }

  return (
    <SearchBar
      {...props}
      elevation={0}
      className={cx(styles['conversationBar'], {
        [styles['conversationBar--mobile']]: isMobile
      })}
      icon={null}
      size="auto"
      placeholder={t('assistant.search.placeholder')}
      value={value}
      disabledClear
      disabledHover
      componentsProps={{
        inputBase: {
          inputRef: inputRef,
          className: 'u-pv-0 u-pl-0',
          rows: 1,
          multiline: true,
          inputProps: {
            className: styles['conversationBar-input']
          },
          autoFocus: !isMobile,
          inputComponent: ComposerPrimitive.Input,
          onKeyDown: handleKeyDown
        }
      }}
    />
  )
}

export default ConversationBar
