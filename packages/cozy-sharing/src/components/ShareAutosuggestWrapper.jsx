import PropTypes from 'prop-types'
import React from 'react'
import { useOnline } from 'rooks'

import { useClient, useQueryAll } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import {
  computeContactsAndGroups,
  hasContactSuggestions,
  isAnyContactQueryLoading
} from '../helpers/contacts'
import { useSharingContext } from '../hooks/useSharingContext'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'

/**
 * ShareAutosuggestWrapper is responsible for fetching contacts and groups.
 * We retrieve all the contacts that are reachable and the groups they belong to.
 * In order to display the total number of members in each group, we also retrieve the contacts that are not reachable.
 * In online API mode, the stack returns suggestions without loading local lists.
 */
const ShareAutosuggestWrapper = ({
  currentRecipients,
  recipients,
  title,
  placeholder,
  enableCreateContact,
  disabled,
  autoFocus,
  roles,
  role,
  onChange,
  onRoleChange,
  onSubmit
}) => {
  const client = useClient()
  const isOnline = useOnline()
  const contactsSuggestEnabled = useSharingContext()?.contactsSuggestEnabled
  const hasRecipientGroups = Boolean(flag('sharing.show-recipient-groups'))
  const useSuggestions =
    contactsSuggestEnabled &&
    hasContactSuggestions(client) &&
    isOnline !== false

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
      enabled: !useSuggestions && hasRecipientGroups
    }
  )

  const contactGroupsQuery = buildContactGroupsQuery()
  const contactGroupsResult = useQueryAll(contactGroupsQuery.definition, {
    ...contactGroupsQuery.options,
    enabled: !useSuggestions
  })

  const isLoading =
    !useSuggestions &&
    isAnyContactQueryLoading([
      reachableContactsResult,
      contactGroupsResult,
      ...(hasRecipientGroups ? [unreachableContactsWithGroupsResult] : [])
    ])

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

  return (
    <ShareAutosuggest
      contactsAndGroups={contactsAndGroups}
      currentRecipients={currentRecipients}
      recipients={recipients}
      title={title}
      placeholder={placeholder}
      isLoading={isLoading}
      useSuggestions={useSuggestions}
      enableCreateContact={enableCreateContact}
      disabled={disabled}
      autoFocus={autoFocus}
      roles={roles}
      role={role}
      onChange={onChange}
      onRoleChange={onRoleChange}
      onSubmit={onSubmit}
    />
  )
}

ShareAutosuggestWrapper.propTypes = {
  currentRecipients: PropTypes.array,
  recipients: PropTypes.array,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  enableCreateContact: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  role: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onRoleChange: PropTypes.func,
  onSubmit: PropTypes.func
}

ShareAutosuggestWrapper.defaultProps = {
  currentRecipients: [],
  recipients: [],
  autoFocus: true
}

export default ShareAutosuggestWrapper
