import { ComposerPrimitive } from '@assistant-ui/react'
import cx from 'classnames'
import React, { useRef } from 'react'

import flag from 'cozy-flags'
import Button from 'cozy-ui/transpiled/react/Buttons'
import Icon from 'cozy-ui/transpiled/react/Icon'
import IconButton from 'cozy-ui/transpiled/react/IconButton'
import GlobeIcon from 'cozy-ui/transpiled/react/Icons/Globe'
import PaperplaneIcon from 'cozy-ui/transpiled/react/Icons/Paperplane'
import StopIcon from 'cozy-ui/transpiled/react/Icons/Stop'
import SearchBar from 'cozy-ui/transpiled/react/SearchBar'
import useEventListener from 'cozy-ui/transpiled/react/hooks/useEventListener'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'
import { useI18n } from 'twake-i18n'

import styles from './styles.styl'

const ConversationBar = ({
  value,
  isEmpty,
  isRunning,
  onKeyDown,
  onSend,
  onCancel,
  websearchEnabled,
  onToggleWebsearch,
  ...props
}) => {
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

  const websearchButton = flag('cozy.assistant.websearch.enabled') ? (
    <IconButton
      className="u-p-0 u-mr-half"
      aria-pressed={websearchEnabled}
      aria-label={t('assistant.websearch.label')}
      title={t('assistant.websearch.label')}
      onClick={onToggleWebsearch}
    >
      <Button
        size="small"
        component="div"
        className="u-miw-auto u-w-2 u-h-2 u-bdrs-circle"
        classes={{ label: 'u-flex u-w-auto' }}
        disabled={!websearchEnabled}
        label={<Icon icon={GlobeIcon} size={12} />}
      />
    </IconButton>
  ) : null

  return (
    <div className="u-w-100 u-maw-7 u-mh-auto">
      <SearchBar
        {...props}
        className={cx(styles['conversationBar'], {
          [styles['conversationBar--mobile']]: isMobile
        })}
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
            endAdornment: (
              <>
                {websearchButton}
                {isRunning ? (
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
                      label={
                        <Icon icon={PaperplaneIcon} size={12} rotate={-45} />
                      }
                      disabled={isEmpty}
                      onClick={handleSend}
                    />
                  </IconButton>
                )}
              </>
            ),
            onKeyDown: handleKeyDown
          }
        }}
      />
    </div>
  )
}

export default ConversationBar
