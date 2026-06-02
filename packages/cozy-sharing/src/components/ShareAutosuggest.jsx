import PropTypes from 'prop-types'
import React, { useState, useRef } from 'react'
import Autosuggest from 'react-autosuggest'

import Avatar from 'cozy-ui/transpiled/react/Avatar'
import Chip from 'cozy-ui/transpiled/react/Chips'
import { Spinner } from 'cozy-ui/transpiled/react/Spinner'

import { GroupAvatar } from './Avatar/GroupAvatar'
import ContactSuggestion from './ContactSuggestion'
import { isContactToBeCreated } from '../helpers/contacts'
import { extractEmails, validateEmail } from '../helpers/email'
import { getDisplayName, getInitials, Contact, Group } from '../models'
import styles from '../styles/autosuggest.styl'
import {
  cozyUrlMatch,
  emailMatch,
  groupNameMatch,
  fullnameMatch
} from '../suggestionMatchers'

const ShareAutocomplete = ({
  loading,
  disabled,
  contactsAndGroups,
  recipients,
  onPick,
  onRemove,
  enableCreateContact,
  placeholder,
  endAdornment
}) => {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isPasted, setIsPasted] = useState(false)
  const [isLoadingDisplayed, setLoadingDisplayed] = useState(false)

  const autosuggestRef = useRef(null)
  const containerRef = useRef(null)

  const computeSuggestions = value => {
    const inputValue = value.trim().toLowerCase()

    return inputValue.length === 0
      ? []
      : contactsAndGroups.filter(
          contactOrGroup =>
            groupNameMatch(inputValue, contactOrGroup) ||
            fullnameMatch(inputValue, contactOrGroup) ||
            emailMatch(inputValue, contactOrGroup) ||
            cozyUrlMatch(inputValue, contactOrGroup)
        )
  }

  const onSuggestionsFetchRequested = ({ value }) => {
    const computedSuggestions = computeSuggestions(value)

    if (computedSuggestions.length > 0) {
      setSuggestions(computedSuggestions)
    } else if (enableCreateContact && validateEmail(value)) {
      setSuggestions([
        {
          email: value,
          _type: Contact.doctype
        }
      ])
    } else {
      setSuggestions([])
    }
  }

  const onSuggestionsClearRequested = () => {
    setSuggestions([])
  }

  const onAutosuggestPaste = () => {
    setIsPasted(true)
  }

  const onAutosuggestChange = (event, { newValue, method }) => {
    if (isPasted) {
      const emails = extractEmails(newValue)
      if (emails) {
        emails.map(email => {
          onAutosuggestPick({ email })
        })
      }
      setIsPasted(false)
    } else {
      if (typeof newValue !== 'object') {
        setInputValue(newValue)
      } else if (method === 'click' || method === 'enter') {
        // A suggestion has been picked
        onAutosuggestPick(newValue)
      }
    }
  }

  const onKeyPress = event => {
    // The user wants to add an unknown email
    if (
      ((event.key === 'Enter' || event.keyCode === 13) &&
        validateEmail(inputValue)) ||
      ((event.key === 'Space' || event.keyCode === 32) &&
        validateEmail(inputValue))
    ) {
      onAutosuggestPick({ email: inputValue })
    }
  }

  const onKeyUp = ({ key, keyCode }) => {
    if (
      recipients.length > 0 &&
      inputValue === '' &&
      (key === 'Backspace' ||
        keyCode === 8 ||
        key === 'Delete' ||
        keyCode === 46)
    ) {
      document.getElementById(`recipient_${recipients.length - 1}`).focus()
    }
  }

  const onAutosuggestFocus = () => {
    // We only show the loading state when the user has focus on the input
    setLoadingDisplayed(true)
  }

  const onAutosuggestBlur = () => {
    if (inputValue !== '' && inputValue.match(/\S+@\S+/)) {
      onAutosuggestPick({ email: inputValue })
    }
  }

  const onAutosuggestPick = value => {
    if (isContactToBeCreated(value) && !enableCreateContact) return

    onPick(value)
    setInputValue('')
    autosuggestRef?.current?.input?.focus()
  }

  const onAutosuggestRemove = value => {
    onRemove(value)
    autosuggestRef?.current?.input?.focus()
  }

  const onSuggestionHighlighted = () => {
    requestAnimationFrame(() => {
      if (!containerRef.current) return
      const highlighted = containerRef.current.querySelector(
        '[aria-selected="true"]'
      )
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest' })
      }
    })
  }

  const renderInput = inputProps => (
    <div className={styles['recipientsContainer']}>
      {recipients.map((recipient, idx) => {
        const isContactGroup = recipient._type === Group.doctype
        const avatarText = getInitials(recipient)
        const name = getDisplayName(recipient)
        return (
          <Chip
            id={`recipient_${idx}`}
            key={`key_recipient_${idx}`}
            avatar={
              isContactGroup ? (
                <GroupAvatar size="xs" />
              ) : (
                <Avatar size="xs">{avatarText}</Avatar>
              )
            }
            label={name}
            onDelete={() => {
              onAutosuggestRemove(recipient)
            }}
            className={styles['recipientChip']}
          />
        )
      })}
      <input {...inputProps} onKeyPress={onKeyPress} onKeyUp={onKeyUp} />
      {loading && isLoadingDisplayed ? (
        <Spinner color="var(--primaryColor)" />
      ) : null}
      {endAdornment ? (
        <div className={styles['endAdornment']}>{endAdornment}</div>
      ) : null}
    </div>
  )

  const renderSuggestion = contactOrGroup => (
    <ContactSuggestion contactOrGroup={contactOrGroup} />
  )

  return (
    <div ref={containerRef}>
      <Autosuggest
        ref={autosuggestRef}
        theme={styles}
        suggestions={suggestions.slice(0, 20)}
        getSuggestionValue={contact => contact}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionsClearRequested={onSuggestionsClearRequested}
        onSuggestionHighlighted={onSuggestionHighlighted}
        renderSuggestion={renderSuggestion}
        renderInputComponent={renderInput}
        highlightFirstSuggestion
        inputProps={{
          autoFocus: true,
          onFocus: onAutosuggestFocus,
          onChange: onAutosuggestChange,
          onPaste: onAutosuggestPaste,
          onBlur: onAutosuggestBlur,
          value: inputValue,
          type: 'email',
          placeholder,
          className: styles['suggestionInput'],
          disabled
        }}
      />
    </div>
  )
}

ShareAutocomplete.propTypes = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  contactsAndGroups: PropTypes.array,
  recipients: PropTypes.array.isRequired,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  enableCreateContact: PropTypes.bool,
  placeholder: PropTypes.string,
  endAdornment: PropTypes.node
}

export default ShareAutocomplete
