import PropTypes from 'prop-types'
import React from 'react'

import { useQueryAll, isQueryLoading } from 'cozy-client'
import { models } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import { getContactsFromGroupId } from '../helpers/contacts'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'

const ContactModel = models.contact

/**
 * ShareRecipientsInput is responsible for fetching contacts and groups.
 * We retrieve all the contacts that are reachable and the groups they belong to.
 * In order to display the total number of members in each group, we also retrieve the contacts that are not reachable.
 */
const isCurrentUser = contact => contact.me === true

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

  const reachableContacts = (reachableContactsResult.data || []).filter(
    contact =>
      !isCurrentUser(contact) &&
      // We do not want contact already in the sharing
      !currentRecipients.find(
        r => r.email === ContactModel.getPrimaryEmail(contact)
      ) &&
      // We do not want contact currently in pending contacts (in chips)
      !recipients.find(r => r._id === contact._id)
  )

  const unreachableContactsWithGroups = (
    unreachableContactsWithGroupsResult.data || []
  ).filter(contact => !isCurrentUser(contact))
  const currentRecipientGroups = currentRecipients
    .map(({ id }) => id)
    .filter(Boolean)
  const contactGroups = (contactGroupsResult.data || [])
    .filter(
      ({ _id }) =>
        !flag('sharing.show-recipient-groups') ||
        !currentRecipientGroups.includes(_id)
    )
    .map(contactGroup => {
      const reachableMembers = getContactsFromGroupId(
        reachableContacts,
        contactGroup.id
      ).map(contact => ({
        ...contact,
        isReachable: true
      }))

      if (flag('sharing.show-recipient-groups') !== true) {
        return {
          ...contactGroup,
          members: reachableMembers
        }
      }

      const unreachableMembers = getContactsFromGroupId(
        unreachableContactsWithGroups,
        contactGroup.id
      ).map(contact => ({
        ...contact,
        isReachable: false
      }))

      return {
        ...contactGroup,
        members: [...reachableMembers, ...unreachableMembers]
      }
    })

  const contactsAndGroups = [...reachableContacts, ...contactGroups]

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
