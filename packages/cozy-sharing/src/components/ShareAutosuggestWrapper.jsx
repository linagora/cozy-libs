import PropTypes from 'prop-types'
import React from 'react'

import { useClient, useQueryAll, isQueryLoading } from 'cozy-client'
import { models } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import { computeContactsAndGroups, suggestContacts } from '../helpers/contacts'
import { DOCTYPE_GROUPS } from '../models'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'

const ContactModel = models.contact

/**
 * ShareAutosuggestWrapper is responsible for fetching contacts and groups.
 * We retrieve all the contacts that are reachable and the groups they belong to.
 * In order to display the total number of members in each group, we also retrieve the contacts that are not reachable.
 * With sharing.contacts-suggest.enabled, the stack suggests the contacts and we only retrieve the group members.
 */
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
  const isSuggestEnabled = !!flag('sharing.contacts-suggest.enabled')

  const reachableContactsQuery = buildReachableContactsQuery({
    inGroups: isSuggestEnabled
  })
  const reachableContactsResult = useQueryAll(
    reachableContactsQuery.definition,
    reachableContactsQuery.options
  )

  const unreachableContactsWithGroupsQuery =
    buildUnreachableContactsWithGroupsQuery()
  const unreachableContactsWithGroupsResult = useQueryAll(
    unreachableContactsWithGroupsQuery.definition,
    {
      ...unreachableContactsWithGroupsQuery.options,
      enabled: !!flag('sharing.show-recipient-groups')
    }
  )

  const contactGroupsQuery = buildContactGroupsQuery()
  const contactGroupsResult = useQueryAll(
    contactGroupsQuery.definition,
    contactGroupsQuery.options
  )

  const isLoading =
    isQueryLoading(reachableContactsResult) ||
    reachableContactsResult.hasMore ||
    isQueryLoading(contactGroupsResult) ||
    contactGroupsResult.hasMore ||
    (flag('sharing.show-recipient-groups') &&
      (isQueryLoading(unreachableContactsWithGroupsResult) ||
        unreachableContactsWithGroupsResult.hasMore))

  const suggestedContactsAndGroups = computeContactsAndGroups({
    reachableContacts: reachableContactsResult.data || [],
    unreachableContactsWithGroups:
      unreachableContactsWithGroupsResult.data || [],
    contactGroups: contactGroupsResult.data || [],
    currentRecipients,
    pendingRecipients: recipients
  })

  const contactsAndGroups = isSuggestEnabled
    ? suggestedContactsAndGroups.filter(({ _type }) => _type === DOCTYPE_GROUPS)
    : suggestedContactsAndGroups

  const isRecipient = email =>
    currentRecipients.some(r => r.email === email) ||
    recipients.some(r => ContactModel.getPrimaryEmail(r) === email)

  const fetchContacts = async q =>
    (await suggestContacts(client, q)).filter(
      contact => !isRecipient(ContactModel.getPrimaryEmail(contact))
    )

  return (
    <ShareAutosuggest
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
      fetchContacts={isSuggestEnabled ? fetchContacts : undefined}
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
