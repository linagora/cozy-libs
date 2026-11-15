import {
  normalizeStackHit,
  resetStackSearchAvailability,
  searchFilesOnStack
} from './searchFiles'

const makeClient = search => ({
  collection: () => ({ search }),
  getStackClient: () => ({ uri: 'https://alice.cozy.example' }),
  getInstanceOptions: () => ({ subdomain: 'flat' })
})

describe('normalizeStackHit', () => {
  const client = makeClient()

  it('links an own file to its folder in Drive', () => {
    const res = normalizeStackHit(client, {
      _id: 'f1',
      type: 'file',
      name: 'Report.pdf',
      mime: 'application/pdf',
      dir_id: 'd1',
      path: '/Documents'
    })
    expect(res).toMatchObject({
      slug: 'drive',
      title: 'Report.pdf',
      subTitle: '/Documents',
      url: 'https://alice-drive.cozy.example/#/folder/d1/file/f1',
      secondaryUrl: 'https://alice-drive.cozy.example/#/folder/d1'
    })
    expect(res.doc._type).toBe('io.cozy.files')
  })

  it('links a shared drive folder to the shared drive route', () => {
    const res = normalizeStackHit(client, {
      _id: 'd2',
      type: 'directory',
      name: 'Specs',
      dir_id: 'd1',
      path: '/Team',
      drive_id: 's1'
    })
    expect(res.url).toBe('https://alice-drive.cozy.example/#/shareddrive/s1/d2')
    expect(res.secondaryUrl).toBe(
      'https://alice-drive.cozy.example/#/shareddrive/s1/d1'
    )
    expect(res.doc.driveId).toBe('s1')
  })
})

describe('searchFilesOnStack', () => {
  beforeEach(() => {
    resetStackSearchAvailability()
  })

  it('returns the normalized hits', async () => {
    const search = jest.fn().mockResolvedValue({
      data: [{ _id: 'f1', type: 'file', name: 'a.txt', dir_id: 'd1' }]
    })
    const results = await searchFilesOnStack(makeClient(search), 'a')
    expect(search).toHaveBeenCalledWith('a', { limit: 20 })
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('a.txt')
  })

  it.each([404, 503])(
    'returns null and stops asking the stack after a %s',
    async status => {
      const search = jest.fn().mockRejectedValue({ status })
      const client = makeClient(search)
      expect(await searchFilesOnStack(client, 'a')).toBe(null)
      expect(await searchFilesOnStack(client, 'b')).toBe(null)
      expect(search).toHaveBeenCalledTimes(1)
    }
  )

  it('returns null when cozy-client has no search method', async () => {
    expect(await searchFilesOnStack(makeClient(undefined), 'a')).toBe(null)
  })

  it('throws the other errors', async () => {
    const search = jest.fn().mockRejectedValue({ status: 500 })
    await expect(searchFilesOnStack(makeClient(search), 'a')).rejects.toEqual({
      status: 500
    })
  })
})
