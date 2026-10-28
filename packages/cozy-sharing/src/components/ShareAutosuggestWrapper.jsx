import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'

import { useClient, useQueryAll, isQueryLoading } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import {
  computeContactsAndGroups,
  fetchContactSuggestions,
  filterContactSuggestions
} from '../helpers/contacts'
import { useSharingContext } from '../hooks/useSharingContext'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery,
  supportsContactSuggestions
} from '../queries/queries'

const ShareAutosuggestWrapper = ({
  currentRecipients,
  recipients,
  placeholder,
  onPick,
  onRemove,
  enableCreateContact,
  disabled,
  autoFocus,
  endAdornment
}) => {
  const client = useClient()
  const contactsSuggestEnabled = useSharingContext()?.contactsSuggestEnabled

  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine !== false
  )
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine !== false)
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
    return () => {
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])
  const useSuggestions =
    contactsSuggestEnabled && supportsContactSuggestions && isOnline
  const reachableContactsQuery = buildReachableContactsQuery()
  const reachableContactsResult = useQueryAll(
    reachableContactsQuery.definition,
    { ...reachableContactsQuery.options, enabled: !useSuggestions }
  )

  const unreachableContactsWithGroupsQuery =
    buildUnreachableContactsWithGroupsQuery()
  const unreachableContactsWithGroupsResult = useQueryAll(
    unreachableContactsWithGroupsQuery.definition,
    {
      ...unreachableContactsWithGroupsQuery.options,
      enabled: !useSuggestions && !!flag('sharing.show-recipient-groups')
    }
  )

  const contactGroupsQuery = buildContactGroupsQuery()
  const contactGroupsResult = useQueryAll(contactGroupsQuery.definition, {
    ...contactGroupsQuery.options,
    enabled: !useSuggestions
  })

  const isLoading =
    !useSuggestions &&
    (isQueryLoading(reachableContactsResult) ||
      reachableContactsResult.hasMore ||
      isQueryLoading(contactGroupsResult) ||
      contactGroupsResult.hasMore ||
      (flag('sharing.show-recipient-groups') &&
        (isQueryLoading(unreachableContactsWithGroupsResult) ||
          unreachableContactsWithGroupsResult.hasMore)))

  const contactsAndGroups = useSuggestions
    ? []
    : computeContactsAndGroups({
        reachableContacts: reachableContactsResult.data || [],
        unreachableContactsWithGroups:
          unreachableContactsWithGroupsResult.data || [],
        contactGroups: contactGroupsResult.data || [],
        currentRecipients,
        pendingRecipients: recipients
      })

  const fetchContacts = async q =>
    filterContactSuggestions(
      await fetchContactSuggestions(client, q),
      currentRecipients,
      recipients
    )

  return (
    <ShareAutosuggest
      key={useSuggestions ? 'suggestions' : 'local'}
      loading={isLoading}
      disabled={disabled}
      contactsAndGroups={contactsAndGroups}
      recipients={recipients}
      onPick={onPick}
      onRemove={onRemove}
      enableCreateContact={enableCreateContact}
      placeholder={placeholder}
      autoFocus={autoFocus}
      endAdornment={endAdornment}
      fetchContacts={useSuggestions ? fetchContacts : null}
    />
  )
}

ShareAutosuggestWrapper.propTypes = {
  currentRecipients: PropTypes.array,
  recipients: PropTypes.array,
  placeholder: PropTypes.string,
  onPick: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  enableCreateContact: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  endAdornment: PropTypes.node
}

ShareAutosuggestWrapper.defaultProps = {
  currentRecipients: [],
  recipients: []
}

export default ShareAutosuggestWrapper
