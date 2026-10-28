import PropTypes from 'prop-types'
import React from 'react'

import { useClient } from 'cozy-client'
import MemberAutocomplete from 'cozy-ui/transpiled/react/MemberAutocomplete'
import { useI18n } from 'twake-i18n'

import {
  fetchSuggestedContacts,
  filterContactsAndGroups,
  makeContactsFromText
} from '../helpers/contacts'
import { makeMembersFromContacts } from '../helpers/members'
import logger from '../logger'

const ShareAutosuggest = ({
  contactsAndGroups,
  currentRecipients,
  recipients,
  title,
  placeholder,
  isLoading,
  useSuggestions,
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
  const { t } = useI18n()

  const instanceUri = client.options.uri
  const value = makeMembersFromContacts({
    contacts: recipients,
    t,
    instanceUri
  })

  const getSuggestions = query => {
    const matchingContacts = filterContactsAndGroups(contactsAndGroups, query)
    return makeMembersFromContacts({
      contacts: matchingContacts,
      t,
      instanceUri
    })
  }

  const fetchSuggestions = async query => {
    try {
      const suggestedContacts = await fetchSuggestedContacts({
        client,
        query,
        currentRecipients,
        pendingRecipients: recipients
      })
      return makeMembersFromContacts({
        contacts: suggestedContacts,
        t,
        instanceUri
      })
    } catch (error) {
      logger.error('Failed to fetch contact suggestions', error)
      return []
    }
  }

  const getMembersFromText = text => {
    const typedContacts = makeContactsFromText(text)
    return makeMembersFromContacts({ contacts: typedContacts, t, instanceUri })
  }

  const handleChange = members => onChange(members.map(member => member.data))

  return (
    <MemberAutocomplete
      value={value}
      getSuggestions={getSuggestions}
      fetchSuggestions={useSuggestions ? fetchSuggestions : undefined}
      minQueryLength={2}
      getMembersFromText={enableCreateContact ? getMembersFromText : undefined}
      roles={roles}
      role={role}
      title={title}
      placeholder={placeholder}
      loading={isLoading}
      disabled={disabled}
      autoFocus={autoFocus}
      onChange={handleChange}
      onRoleChange={onRoleChange}
      onSubmit={onSubmit}
    />
  )
}

ShareAutosuggest.propTypes = {
  /** Contacts and groups to suggest locally */
  contactsAndGroups: PropTypes.array.isRequired,
  currentRecipients: PropTypes.array.isRequired,
  recipients: PropTypes.array.isRequired,
  title: PropTypes.string,
  placeholder: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  /** Whether the stack suggests the contacts while typing */
  useSuggestions: PropTypes.bool,
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

export default ShareAutosuggest
