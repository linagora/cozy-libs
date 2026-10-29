import PropTypes from 'prop-types'
import React from 'react'

import { useClient, useQueryAll, isQueryLoading } from 'cozy-client'
import { models } from 'cozy-client'
import flag from 'cozy-flags'

import { computeContactsAndGroups, suggestContacts } from '../helpers/contacts'
import { makeAvatarUrl } from '../helpers/recipients'
import { useSharingContext } from '../hooks/useSharingContext'
import { DOCTYPE_GROUPS } from '../models'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'
import ShareAutosuggest from './ShareAutosuggest'

const ContactModel = models.contact

/**
 * ShareAutosuggestWrapper is responsible for fetching contacts and groups.
 * We retrieve all the contacts that are reachable and the groups they belong to.
 * In order to display the total number of members in each group, we also retrieve the contacts that are not reachable.
 * With contactsSuggestEnabled, the stack suggests the contacts and we only retrieve the group members.
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
  const contactsSuggestEnabled = useSharingContext()?.contactsSuggestEnabled

  const reachableContactsQuery = buildReachableContactsQuery({
    inGroups: contactsSuggestEnabled
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

  const contactsAndGroups = contactsSuggestEnabled
    ? suggestedContactsAndGroups.filter(({ _type }) => _type === DOCTYPE_GROUPS)
    : suggestedContactsAndGroups

  // The stack matches the emails whatever their case
  const normalizeEmail = email => email?.trim().toLowerCase()
  const isRecipient = email =>
    currentRecipients.some(r => normalizeEmail(r.email) === email) ||
    recipients.some(
      r => normalizeEmail(ContactModel.getPrimaryEmail(r)) === email
    )

  const fetchContacts = async q =>
    (await suggestContacts(client, q)).filter(
      contact =>
        !isRecipient(normalizeEmail(ContactModel.getPrimaryEmail(contact)))
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
      fetchContacts={contactsSuggestEnabled ? fetchContacts : undefined}
      getAvatarUrl={recipient => makeAvatarUrl(recipient, client.options.uri)}
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
