import { generateWebLink } from 'cozy-client'
import { isNote, isDocs } from 'cozy-client/dist/models/file'

// Cozy-only link builders, kept out of the presentational components so the
// view layer never has to know the Twake URL scheme (which app serves which
// doctype, and under which hash). Views receive a ready-made `url` instead.

const TMAIL_PREFIX = 'tmail_'

const makeWebLink = (client, slug, hash) => {
  // No client means no instance to link to: callers render an unlinked item
  // rather than a broken href (this is what guarded the previous inline
  // implementations against crashing on a missing client).
  if (!client) return undefined
  return generateWebLink({
    slug,
    cozyUrl: client.getStackClient().uri,
    subDomainType: client.getInstanceOptions().subdomain,
    hash
  })
}

const getFileSlug = file => {
  if (isNote(file)) {
    return 'notes'
  }
  if (isDocs(file)) {
    return 'docs'
  }
  return 'drive'
}

const getFileHash = (file, slug) => {
  if (slug === 'notes') {
    return `/n/${file._id}`
  }
  if (slug === 'docs') {
    return `/bridge/docs/${file.metadata.externalId}`
  }
  return `/folder/${file.dir_id}/file/${file._id}`
}

export const makeFileUrl = (client, file) => {
  const slug = getFileSlug(file)
  return makeWebLink(client, slug, getFileHash(file, slug))
}

export const makeEmailUrl = (client, email) => {
  // FIXME: This prefix removal is a temporary workaround for tmail indexing.
  // The tmail_ prefix have to be removed from tmail indexing
  const emailId = email.id.startsWith(TMAIL_PREFIX)
    ? email.id.slice(TMAIL_PREFIX.length)
    : email.id
  return makeWebLink(client, 'mail', `/bridge/dashboard/${emailId}`)
}

export const makeFolderUrl = (client, dirId) =>
  makeWebLink(client, 'drive', `/folder/${dirId}`)
