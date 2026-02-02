import { Q, fetchPolicies } from 'cozy-client'

const CONTACTS_DOCTYPE = 'io.cozy.contacts'
export const CHAT_CONVERSATIONS_DOCTYPE = 'io.cozy.ai.chat.conversations'
export const CHAT_EVENTS_DOCTYPE = 'io.cozy.ai.chat.events'
export const FILES_DOCTYPE = 'io.cozy.files'
export const EMAIL_DOCTYPE = 'com.linagora.email'

const defaultFetchPolicy = fetchPolicies.olderThan(86400) // 24 hours

export const buildFilesByIds = (ids, enabled) => {
  return {
    definition: Q(FILES_DOCTYPE).getByIds(ids),
    options: {
      as: `${FILES_DOCTYPE}/${ids.join('')}`,
      fetchPolicy: defaultFetchPolicy,
      enabled
    }
  }
}

export const buildChatConversationQueryById = id => {
  return {
    definition: Q(CHAT_CONVERSATIONS_DOCTYPE).getById(id),
    options: {
      as: `${CHAT_CONVERSATIONS_DOCTYPE}/${id}`,
      fetchPolicy: defaultFetchPolicy,
      singleDocData: true
    }
  }
}

export const buildMyselfQuery = () => {
  return {
    definition: Q(CONTACTS_DOCTYPE).where({ me: true }),
    options: {
      as: `${CONTACTS_DOCTYPE}/myself`,
      fetchPolicy: defaultFetchPolicy
    }
  }
}

export const buildAssistantsQuery = () => ({
  definition: () =>
    Q('io.cozy.ai.chat.assistants')
      .where({})
      .include(['provider'])
      .indexFields(['cozyMetadata.updatedAt'])
      .sortBy([{ 'cozyMetadata.updatedAt': 'desc' }]),
  options: {
    as: 'io.cozy.ai.chat.assistants/list',
    fetchPolicy: defaultFetchPolicy
  }
})

export const buildAssistantByIdQuery = id => ({
  definition: () =>
    Q('io.cozy.ai.chat.assistants').getById(id).include(['provider']),
  options: {
    as: 'io.cozy.ai.chat.assistants/' + id,
    fetchPolicy: defaultFetchPolicy,
    singleDocData: true,
    enabled: !!id
  }
})
