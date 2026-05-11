import PropTypes from 'prop-types'
import React, { forwardRef, useRef, useState } from 'react'

import ActionsMenu from 'cozy-ui/transpiled/react/ActionsMenu'
import { makeActions } from 'cozy-ui/transpiled/react/ActionsMenu/Actions'
import ActionsMenuItem from 'cozy-ui/transpiled/react/ActionsMenu/ActionsMenuItem'
import DropdownButton from 'cozy-ui/transpiled/react/DropdownButton'
import ListItemIcon from 'cozy-ui/transpiled/react/ListItemIcon'
import ListItemText from 'cozy-ui/transpiled/react/ListItemText'
import Radios from 'cozy-ui/transpiled/react/Radios'

import logger from '../logger'

const makeShareTypeAction = ({ option, isSelected, onSelect }) => {
  const Component = forwardRef((props, ref) => (
    <ActionsMenuItem
      {...props}
      ref={ref}
      onClick={() => onSelect(option.value)}
      disabled={option.disabled}
    >
      <ListItemIcon>
        <Radios checked={isSelected} />
      </ListItemIcon>
      <ListItemText primary={option.label} />
    </ActionsMenuItem>
  ))
  Component.displayName = `ShareTypeAction-${option.value}`

  return () => ({
    name: `shareType-${option.value}`,
    label: option.label,
    icon: null,
    action: () => onSelect(option.value),
    Component
  })
}

const ShareTypeSelect = ({ value, options, onChange }) => {
  const buttonRef = useRef()
  const [isOpen, setOpen] = useState(false)

  const open = () => setOpen(true)
  const close = () => setOpen(false)

  const onSelect = nextValue => {
    onChange(nextValue)
    setOpen(false)
  }

  const selectedOption =
    options.find(option => option.value === value) ?? options[0]

  const actions = makeActions(
    options.map(option =>
      makeShareTypeAction({
        option,
        isSelected: option.value === selectedOption.value,
        onSelect
      })
    )
  )

  return (
    <>
      <DropdownButton
        ref={buttonRef}
        onClick={open}
        textVariant="body2"
        size="small"
      >
        {selectedOption.label}
      </DropdownButton>
      <ActionsMenu
        ref={buttonRef}
        open={isOpen}
        actions={actions}
        autoClose
        onClose={close}
      />
    </>
  )
}

ShareTypeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array.isRequired
}

ShareTypeSelect.defaultProps = {
  onChange: logger.log,
  value: ''
}

export default ShareTypeSelect
