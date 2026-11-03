import PropTypes from 'prop-types'
import React from 'react'

import { useQueryAll } from 'cozy-client'
import flag from 'cozy-flags'

import ShareAutosuggest from './ShareAutosuggest'
import {
  computeContactsAndGroups,
  isAnyContactQueryLoading
} from '../helpers/contacts'
import { useSharingContext } from '../hooks/useSharingContext'
import { DOCTYPE_GROUPS } from '../models'
import {
  buildReachableContactsQuery,
  buildContactGroupsQuery,
  buildUnreachableContactsWithGroupsQuery
} from '../queries/queries'

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
  enableCreateContact,
  disabled,
  autoFocus,
  roles,
  role,
  onChange,
  onRoleChange,
  onSubmit
}) => {
  const contactsSuggestEnabled = useSharingContext()?.contactsSuggestEnabled
  const hasRecipientGroups = Boolean(flag('sharing.show-recipient-groups'))

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
      enabled: hasRecipientGroups
    }
  )

  const contactGroupsQuery = buildContactGroupsQuery()
  const contactGroupsResult = useQueryAll(
    contactGroupsQuery.definition,
    contactGroupsQuery.options
  )

  const isLoading = isAnyContactQueryLoading([
    reachableContactsResult,
    contactGroupsResult,
    ...(hasRecipientGroups ? [unreachableContactsWithGroupsResult] : [])
  ])

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

  return (
    <ShareAutosuggest
      contactsAndGroups={contactsAndGroups}
      currentRecipients={currentRecipients}
      recipients={recipients}
      placeholder={placeholder}
      isLoading={isLoading}
      contactsSuggestEnabled={contactsSuggestEnabled}
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
