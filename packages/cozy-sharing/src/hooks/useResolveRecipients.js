import { useCallback } from 'react'

import { useClient } from 'cozy-client'

import { getOrCreateFromArray } from '../helpers/contacts'
import { DOCTYPE_CONTACTS } from '../models'

/**
 * Turns the recipients picked in a sharing form into contacts, creating the
 * missing ones, and splits them by the selected sharing right.
 *
 * @returns {Function} `resolveRecipients(pendingRecipients, selectedOption, createContact?)`
 * resolving to `{ recipients, readOnlyRecipients }`, ready to be passed to `share`
 */
export const useResolveRecipients = () => {
  const client = useClient()

  return useCallback(
    async (
      pendingRecipients,
      selectedOption = 'readWrite',
      createContact = contact => client.create(DOCTYPE_CONTACTS, contact)
    ) => {
      const contacts = await getOrCreateFromArray(
        client,
        pendingRecipients,
        createContact
      )
      const isReadOnly = selectedOption === 'readOnly'

      return {
        recipients: isReadOnly ? [] : contacts,
        readOnlyRecipients: isReadOnly ? contacts : []
      }
    },
    [client]
  )
}
