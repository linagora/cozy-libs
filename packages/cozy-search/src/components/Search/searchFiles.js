import { generateWebLink, models } from 'cozy-client'

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
 * shortcut: the hits have no metadata, so a note is found by its name, and a
 * Nextcloud entry opens as a shortcut; add the fields to the hits if they need
 * the exact checks.
 *
 * @param {import('cozy-client').default} client - cozy client
 * @param {object} file - a hit of FileCollection.search
 * @returns {object} the result
 */
export const normalizeStackHit = (client, file) => {
  const isDir = file.type === 'directory'
  const driveId = file.driveId
  const folderHash = id =>
    driveId ? `/shareddrive/${driveId}/${id}` : `/folder/${id}`
  const dirHash = folderHash(isDir ? file._id : file.dir_id)
  const inDrive = driveId ? `${driveId}/` : ''

  let hash = dirHash
  if (isDir) {
    // The folder itself
  } else if (models.file.isShortcut(file)) {
    hash = `/external/${inDrive}${file._id}`
  } else if (file.name?.endsWith('.cozy-note')) {
    // Drive opens the note on the instance that created it
    hash = `/note/${inDrive}${file._id}`
  } else if (!driveId && models.file.shouldBeOpenedByOnlyOffice(file)) {
    hash = `/onlyoffice/${file._id}?redirectLink=drive${dirHash}`
  } else {
    hash = `${dirHash}/file/${file._id}`
  }

  return {
    doc: { ...file, _type: FILES_DOCTYPE },
    slug: 'drive',
    title: file.name,
    // The folder of the item, as DataProxy shows it
    subTitle: file.path.slice(0, file.path.lastIndexOf('/')) || '/',
    url: makeDriveLink(client, hash),
    secondaryUrl: makeDriveLink(client, folderHash(file.dir_id))
  }
}

// For the tests
export const resetStackSearchAvailability = () => {
  stackSearchUnavailable = false
}
