import { generateWebLink } from 'cozy-client'

const FILES_DOCTYPE = 'io.cozy.files'
const SEARCH_LIMIT = 20

// Set once the stack has answered that it cannot search
let stackSearchUnavailable = false

/**
 * Searches the files with the stack (POST /files/search).
 *
 * @param {import('cozy-client').default} client - cozy client
 * @param {string} searchValue - the searched text
 * @returns {Promise<Array<object>|null>} the results, in the DataProxy shape, or null when the stack cannot search
 */
export const searchFilesOnStack = async (client, searchValue) => {
  const collection = client.collection(FILES_DOCTYPE)
  if (stackSearchUnavailable || typeof collection.search !== 'function') {
    return null
  }
  try {
    const { data } = await collection.search(searchValue, {
      limit: SEARCH_LIMIT
    })
    return data.map(file => normalizeStackHit(client, file))
  } catch (err) {
    // 404: the stack has no search route, 503: search is not configured
    if (err?.status === 404 || err?.status === 503) {
      stackSearchUnavailable = true
      return null
    }
    throw err
  }
}

const makeDriveLink = (client, hash) =>
  generateWebLink({
    cozyUrl: client.getStackClient().uri,
    slug: 'drive',
    subDomainType: client.getInstanceOptions().subdomain,
    hash,
    pathname: '',
    searchParams: []
  })

/**
 * Turns a hit of the stack search into a result in the DataProxy shape.
 *
 * shortcut: the hits have no metadata, so notes, shortcuts and Nextcloud
 * entries open in the Drive viewer like other files; add the fields to the
 * hits if they need their own route.
 *
 * @param {import('cozy-client').default} client - cozy client
 * @param {object} file - a hit of FileCollection.search
 * @returns {object} the result
 */
export const normalizeStackHit = (client, file) => {
  const isDir = file.type === 'directory'
  const dirId = isDir ? file._id : file.dir_id
  const folderHash = file.drive_id
    ? `/shareddrive/${file.drive_id}/${dirId}`
    : `/folder/${dirId}`
  const parentHash = file.drive_id
    ? `/shareddrive/${file.drive_id}/${file.dir_id}`
    : `/folder/${file.dir_id}`
  return {
    doc: { ...file, _type: FILES_DOCTYPE, driveId: file.drive_id },
    slug: 'drive',
    title: file.name,
    subTitle: file.path,
    url: makeDriveLink(
      client,
      isDir ? folderHash : `${folderHash}/file/${file._id}`
    ),
    secondaryUrl: makeDriveLink(client, parentHash)
  }
}

// For the tests
export const resetStackSearchAvailability = () => {
  stackSearchUnavailable = false
}
