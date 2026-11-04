import { getPublicAccessStatus, isViewerOnlyLink } from './publicAccess'

const READ_ONLY = { files: { verbs: ['GET'] } }
const WRITE = { files: { verbs: ['GET', 'POST', 'PUT', 'PATCH'] } }

const makePermissions = ({ permissions = READ_ONLY, ...attributes }) => [
  { attributes: { permissions, ...attributes } }
]

describe('getPublicAccessStatus', () => {
  it('is restricted without link', () => {
    expect(getPublicAccessStatus({ link: null, permissions: [] })).toEqual({
      key: 'restricted',
      expiresDate: null
    })
  })

  it('tells view or edit without password nor expiration', () => {
    expect(
      getPublicAccessStatus({ link: 'url', permissions: makePermissions({}) })
    ).toEqual({ key: 'view', expiresDate: null })
    expect(
      getPublicAccessStatus({
        link: 'url',
        permissions: makePermissions({ permissions: WRITE })
      }).key
    ).toBe('edit')
  })

  it('tells password, expiration, or both', () => {
    const expiresDate = '2026-09-24T00:00:00Z'
    expect(
      getPublicAccessStatus({
        link: 'url',
        permissions: makePermissions({ password: true })
      }).key
    ).toBe('password')
    expect(
      getPublicAccessStatus({
        link: 'url',
        permissions: makePermissions({ expires_at: expiresDate })
      })
    ).toEqual({ key: 'expires', expiresDate })
    expect(
      getPublicAccessStatus({
        link: 'url',
        permissions: makePermissions({
          password: true,
          expires_at: expiresDate
        })
      }).key
    ).toBe('passwordAndExpires')
  })
})

describe('isViewerOnlyLink', () => {
  it('allows only viewer links on albums', () => {
    expect(
      isViewerOnlyLink({
        documentType: 'Albums',
        document: { _id: '1' },
        hasWriteAccess: () => true
      })
    ).toBe(true)
  })

  it('allows only viewer links to a read-only shared drive member', () => {
    expect(
      isViewerOnlyLink({
        documentType: 'Files',
        document: { _id: '1', driveId: 'd' },
        hasWriteAccess: () => false,
        getSharingById: () => ({ id: 'd' })
      })
    ).toBe(true)
  })

  it('allows editor links on a folder whose shared drive no longer exists', () => {
    expect(
      isViewerOnlyLink({
        documentType: 'Files',
        document: { _id: '1', driveId: 'd' },
        hasWriteAccess: () => false,
        getSharingById: () => undefined
      })
    ).toBe(false)
  })

  it('allows editor links otherwise', () => {
    expect(
      isViewerOnlyLink({
        documentType: 'Files',
        document: { _id: '1', driveId: 'd' },
        hasWriteAccess: () => true,
        getSharingById: () => ({ id: 'd' })
      })
    ).toBe(false)
    expect(
      isViewerOnlyLink({
        documentType: 'Files',
        document: { _id: '1' },
        hasWriteAccess: () => false
      })
    ).toBe(false)
  })
})
