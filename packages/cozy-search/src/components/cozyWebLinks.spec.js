import { isDocs, isNote } from 'cozy-client/dist/models/file'

import { makeEmailUrl, makeFileUrl, makeFolderUrl } from './cozyWebLinks'

jest.mock('cozy-client', () => ({
  generateWebLink: jest.fn(
    ({ cozyUrl, subDomainType, slug, hash }) =>
      `${cozyUrl}|${subDomainType}|${slug}|${hash}`
  )
}))
jest.mock('cozy-client/dist/models/file', () => ({
  isNote: jest.fn(() => false),
  isDocs: jest.fn(() => false)
}))

const client = {
  getStackClient: () => ({ uri: 'https://alice.twake.app' }),
  getInstanceOptions: () => ({ subdomain: 'flat' })
}

const PREFIX = 'https://alice.twake.app|flat'

describe('cozyWebLinks', () => {
  describe('makeFileUrl', () => {
    it('links a regular file to Drive, inside its parent folder', () => {
      const file = { _id: 'f1', dir_id: 'd1', name: 'notes.pdf' }
      expect(makeFileUrl(client, file)).toBe(
        `${PREFIX}|drive|/folder/d1/file/f1`
      )
    })

    it('links a note to the Notes app', () => {
      isNote.mockReturnValueOnce(true)
      expect(makeFileUrl(client, { _id: 'n1', dir_id: 'd1' })).toBe(
        `${PREFIX}|notes|/n/n1`
      )
    })

    it('links a docs file through the docs bridge, by external id', () => {
      isDocs.mockReturnValueOnce(true)
      const file = { _id: 'x1', dir_id: 'd1', metadata: { externalId: 'ext9' } }
      expect(makeFileUrl(client, file)).toBe(`${PREFIX}|docs|/bridge/docs/ext9`)
    })
  })

  describe('makeEmailUrl', () => {
    it('links an email through the mail bridge', () => {
      expect(makeEmailUrl(client, { id: 'e1' })).toBe(
        `${PREFIX}|mail|/bridge/dashboard/e1`
      )
    })

    it('strips the tmail_ indexing prefix', () => {
      expect(makeEmailUrl(client, { id: 'tmail_e1' })).toBe(
        `${PREFIX}|mail|/bridge/dashboard/e1`
      )
    })

    it('only strips the prefix at the start', () => {
      expect(makeEmailUrl(client, { id: 'x_tmail_e1' })).toBe(
        `${PREFIX}|mail|/bridge/dashboard/x_tmail_e1`
      )
    })
  })

  it('links a knowledge-base folder to Drive', () => {
    expect(makeFolderUrl(client, 'dir42')).toBe(`${PREFIX}|drive|/folder/dir42`)
  })

  it('yields no link at all when there is no client', () => {
    expect(makeFileUrl(null, { _id: 'f1', dir_id: 'd1' })).toBeUndefined()
    expect(makeEmailUrl(null, { id: 'e1' })).toBeUndefined()
    expect(makeFolderUrl(null, 'dir42')).toBeUndefined()
  })
})
