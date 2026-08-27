import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { DialogCloseButton } from 'cozy-ui/transpiled/react/CozyDialogs'
import Dialog from 'cozy-ui/transpiled/react/Dialog'

import CozyTheme from '../../providers/CozyTheme'
import IntentIframe, { iframeProps } from '../IntentIframe'

/**
 * Wrapper that adds an `onClick` handler to its children that opens a dialog
 * for the specified intent.
 */
const IntentDialogOpener = props => {
  const {
    options,
    action,
    doctype,
    children,
    closable,
    showCloseButton,
    create,
    tag,
    onComplete,
    onDismiss,
    onReadyToUse,
    waitForReadyToUse,
    iframeProps,
    Component,
    ...componentProps
  } = props
  const [modalOpened, setModalOpened] = useState(false)

  const openModal = ev => {
    ev.preventDefault()
    ev.stopPropagation()
    setModalOpened(true)
  }
  const closeModal = () => setModalOpened(false)

  const handleComplete = result => {
    closeModal()
    onComplete && onComplete(result)
  }

  const handleDismiss = () => {
    closeModal()
    onDismiss && onDismiss()
  }

  const Tag = tag // React needs uppercase element names
  const themeType = options?.theme?.type
  const forcedTheme = ['light', 'dark'].includes(themeType)
    ? themeType
    : undefined
  const elements = [
    React.cloneElement(children, { key: 'opener', onClick: openModal })
  ]

  if (modalOpened) {
    elements.push(
      <CozyTheme key="intent-modal" type={forcedTheme}>
        <Component
          open={modalOpened}
          onClose={closable && handleDismiss}
          {...componentProps}
        >
          {closable && showCloseButton && (
            <DialogCloseButton onClick={handleDismiss} />
          )}
          <IntentIframe
            action={action}
            type={doctype}
            data={options}
            create={create}
            onCancel={handleDismiss}
            onTerminate={handleComplete}
            onReadyToUse={onReadyToUse}
            waitForReadyToUse={waitForReadyToUse}
            iframeProps={iframeProps}
          />
        </Component>
      </CozyTheme>
    )
  }

  return <Tag>{elements}</Tag>
}

IntentDialogOpener.propTypes = {
  /** Element on which the onClick handler will be added */
  children: PropTypes.element.isRequired,
  /** What should happen when the intent has completed */
  onComplete: PropTypes.func,
  /** What should happen when the intent has dismissed */
  onDismiss: PropTypes.func,
  /** Called when the intent service signals it is ready to use */
  onReadyToUse: PropTypes.func,
  /** Keep the loading state until the intent service signals it is ready to use */
  waitForReadyToUse: PropTypes.bool,
  /** Action you want to execute */
  action: PropTypes.string.isRequired,
  /** Options passed to the intent */
  options: PropTypes.shape({
    theme: PropTypes.shape({
      type: PropTypes.oneOf(['light', 'dark'])
    })
  }),
  /** Doctype on which you want to execute the action */
  doctype: PropTypes.string.isRequired,
  /** Whether the dialog is closable by itself (not by the Intent) with a button or by clicking outside of it */
  closable: PropTypes.bool.isRequired,
  /** Whether the dialog close button is shown */
  showCloseButton: PropTypes.bool.isRequired,
  /** Tag used to wrap children */
  tag: PropTypes.string.isRequired,
  /** Component to be used instead of the dialog */
  Component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  /** Props to be passed to the iframe */
  iframeProps: iframeProps
}

IntentDialogOpener.defaultProps = {
  tag: 'span',
  closable: true,
  Component: Dialog,
  showCloseButton: true,
  waitForReadyToUse: false
}

export default IntentDialogOpener
