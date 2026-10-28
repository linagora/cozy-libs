import PropTypes from 'prop-types'
import React, { useEffect, useState, useRef } from 'react'
import Autosuggest from 'react-autosuggest'

import Chip from 'cozy-ui/transpiled/react/Chips'
import { Spinner } from 'cozy-ui/transpiled/react/Spinner'
import Typography from 'cozy-ui/transpiled/react/Typography'
import { useI18n } from 'twake-i18n'

import { GroupAvatar } from './Avatar/GroupAvatar'
import { MemberAvatar } from './Avatar/MemberAvatar'
import ContactSuggestion from './ContactSuggestion'
import { isContactToBeCreated } from '../helpers/contacts'
import { extractEmails, validateEmail } from '../helpers/email'
import logger from '../logger'
import { getDisplayName, DOCTYPE_CONTACTS, DOCTYPE_GROUPS } from '../models'
import styles from '../styles/autosuggest.styl'
import { contactOrGroupMatch } from '../suggestionMatchers'

const FETCH_CONTACTS_DEBOUNCE = 300
const FETCH_CONTACTS_MIN_LENGTH = 2

const ShareAutosuggest = ({
  loading,
  disabled,
  contactsAndGroups,
  recipients,
  onPick,
  onRemove,
  enableCreateContact,
  placeholder,
  autoFocus,
  endAdornment,
  fetchContacts,
  offline
}) => {
  const { t } = useI18n()
  const [fetchError, setFetchError] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isPasted, setIsPasted] = useState(false)
  const [isLoadingDisplayed, setLoadingDisplayed] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const autosuggestRef = useRef(null)
  const containerRef = useRef(null)
  const fetchTimeoutRef = useRef(null)
  const fetchSequenceRef = useRef(0)
  const usesRemoteSearch = typeof fetchContacts === 'function'

  useEffect(
    () => () => {
      clearTimeout(fetchTimeoutRef.current)
      fetchSequenceRef.current += 1
    },
    []
  )

  const computeSuggestions = value => {
    const inputValue = value.trim().toLowerCase()

    return inputValue.length === 0
      ? []
      : contactsAndGroups.filter(contactOrGroup =>
          contactOrGroupMatch(inputValue, contactOrGroup)
        )
  }

  const showSuggestions = (computedSuggestions, value) => {
    if (computedSuggestions.length > 0) {
      setSuggestions(computedSuggestions)
    } else if (enableCreateContact && validateEmail(value)) {
      setSuggestions([
        {
          email: value,
          _type: DOCTYPE_CONTACTS
        }
      ])
    } else {
      setSuggestions([])
    }
  }

  const onSuggestionsFetchRequested = ({ value }) => {
    clearTimeout(fetchTimeoutRef.current)
    const sequence = ++fetchSequenceRef.current
    setFetchError(false)
    setHasSearched(false)

    if (!usesRemoteSearch) {
      showSuggestions(computeSuggestions(value), value)
      return
    }
    setSuggestions([])
    if (Array.from(value.trim()).length < FETCH_CONTACTS_MIN_LENGTH) {
      setIsFetching(false)
      return
    }

    setIsFetching(true)
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await fetchContacts(value.trim())
        if (fetchSequenceRef.current !== sequence) return
        setIsFetching(false)
        setHasSearched(true)
        showSuggestions(results, value)
      } catch (err) {
        if (fetchSequenceRef.current !== sequence) return
        setIsFetching(false)
        setFetchError(true)
        logger.error('Failed to fetch contact suggestions', err)
      }
    }, FETCH_CONTACTS_DEBOUNCE)
  }

  const onSuggestionsClearRequested = () => {
    clearTimeout(fetchTimeoutRef.current)
    fetchSequenceRef.current += 1
    setIsFetching(false)
    setFetchError(false)
    setHasSearched(false)
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

    onSuggestionsClearRequested()
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
        const isContactGroup = recipient._type === DOCTYPE_GROUPS
        const name = getDisplayName(recipient)
        return (
          <Chip
            id={`recipient_${idx}`}
            key={`key_recipient_${idx}`}
            avatar={
              isContactGroup ? (
                <GroupAvatar size="xs" color={recipient.color} />
              ) : (
                <MemberAvatar size="xs" recipient={recipient} />
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
      {(loading || isFetching) && isLoadingDisplayed ? (
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
          autoFocus,
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
      {offline && (
        <Typography variant="caption" role="status">
          {t('Share.suggestions.offline')}
        </Typography>
      )}
      {fetchError && (
        <Typography variant="caption" role="alert">
          {t('Share.loadingError')}
        </Typography>
      )}
      {hasSearched && suggestions.length === 0 && (
        <Typography variant="caption" role="status">
          {t('Share.suggestions.empty')}
        </Typography>
      )}
    </div>
  )
}

ShareAutosuggest.defaultProps = {
  autoFocus: true
}

ShareAutosuggest.propTypes = {
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  contactsAndGroups: PropTypes.array,
  recipients: PropTypes.array.isRequired,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  enableCreateContact: PropTypes.bool,
  placeholder: PropTypes.string,
  autoFocus: PropTypes.bool,
  endAdornment: PropTypes.node,
  fetchContacts: PropTypes.func,
  offline: PropTypes.bool
}

export default ShareAutosuggest
