import CozyClient from 'cozy-client'
import type PouchLink from 'cozy-pouch-link'

// Duck typed so that apps without local search do not have to install
// cozy-pouch-link and PouchDB.
const isPouchLink = (link: object): link is PouchLink =>
  'startReplicationWithDebounce' in link

export const getPouchLink = (client?: CozyClient): PouchLink | null => {
  if (!client) {
    return null
  }
  return client.links.find(isPouchLink) ?? null
}
