import PropTypes from 'prop-types'
import React from 'react'

import { useQueryAll, isQueryLoading } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import { computeContactsAndGroups } from '../helpers/contacts'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'

/**
 * ShareRecipientsInput is responsible for fetching contacts and groups.
 * We retrieve all the contacts that are reachable and the groups they belong to.
 * In order to display the total number of members in each group, we also retrieve the contacts that are not reachable.
 */
const ShareRecipientsInput = ({
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
  const reachableContactsQuery = buildReachableContactsQuery()
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

  const contactsAndGroups = computeContactsAndGroups({
    reachableContacts: reachableContactsResult.data || [],
    unreachableContactsWithGroups:
      unreachableContactsWithGroupsResult.data || [],
    contactGroups: contactGroupsResult.data || [],
    currentRecipients,
    pendingRecipients: recipients
  })

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
    />
  )
}

ShareRecipientsInput.propTypes = {
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

ShareRecipientsInput.defaultProps = {
  currentRecipients: [],
  recipients: []
}

export default ShareRecipientsInput
