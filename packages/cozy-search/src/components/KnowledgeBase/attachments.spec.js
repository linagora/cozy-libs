import {
  ATTACHMENTS_MAX_FILES,
  collectAttachmentsResolution,
  getDocId,
  isAttachmentsBlocked
} from './attachments'
import { buildFilesByDirIdQuery } from '../queries'

const file = (id, attrs = {}) => ({ _id: id, type: 'file', name: id, ...attrs })
const dir = (id, attrs = {}) => ({ _id: id, type: 'directory', name: id, ...attrs })
const loaded = docs => ({ data: docs, fetchStatus: 'loaded', hasMore: false })

describe('getDocId', () => {
  it('prefers _id and falls back to id (intent-returned docs)', () => {
    expect(getDocId({ _id: 'a', id: 'b' })).toBe('a')
    expect(getDocId({ id: 'b' })).toBe('b')
  })
})

describe('collectAttachmentsResolution', () => {
  it('resolves directly picked files without any directory query', () => {
    const picked = [file('f1'), file('f2')]
    const res = collectAttachmentsResolution({
      selectedDocs: picked,
      pickedDocs: picked,
      pickedFetchStatus: 'loaded',
      resultsByDirId: {}
    })
    expect(res.attachmentIds.sort()).toEqual(['f1', 'f2'])
    expect(res.dirIds).toEqual([])
    expect(res.isLoading).toBe(false)
    expect(res.isOverLimit).toBe(false)
    expect(res.isUnavailable).toBe(false)
  })

  it('is loading until the picked docs are fetched', () => {
    const picked = [file('f1')]
    const res = collectAttachmentsResolution({
      selectedDocs: picked,
      pickedDocs: undefined,
      pickedFetchStatus: 'loading',
      resultsByDirId: {}
    })
    expect(res.isLoading).toBe(true)
  })

  it('walks directories level by level and collects nested files', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {
        d1: loaded([file('f1'), dir('d2')]),
        d2: loaded([file('f2')])
      }
    })
    expect(res.dirIds).toEqual(['d1', 'd2'])
    expect(res.attachmentIds.sort()).toEqual(['f1', 'f2'])
    expect(res.isLoading).toBe(false)
  })

  it('is loading while a discovered directory has no loaded result', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([dir('d2')]) }
    })
    expect(res.dirIds).toEqual(['d1', 'd2'])
    expect(res.isLoading).toBe(true)
  })

  it('deduplicates a picked file that also lives in a picked folder', () => {
    const root = dir('d1')
    const dup = file('f1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root, dup],
      pickedDocs: [root, dup],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([file('f1')]) }
    })
    expect(res.attachmentIds).toEqual(['f1'])
  })

  it('ignores trashed files found during traversal', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {
        d1: loaded([file('f1'), file('f2', { trashed: true })])
      }
    })
    expect(res.attachmentIds).toEqual(['f1'])
  })

  it('reports over-limit above ATTACHMENTS_MAX_FILES', () => {
    const root = dir('d1')
    const tooMany = Array.from({ length: ATTACHMENTS_MAX_FILES + 1 }, (_, i) =>
      file(`f${i}`)
    )
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded(tooMany) }
    })
    expect(res.isOverLimit).toBe(true)
  })

  it('reports over-limit above ATTACHMENTS_MAX_FILES and stops traversal', () => {
    const root = dir('d1')
    const tooMany = Array.from({ length: ATTACHMENTS_MAX_FILES + 1 }, (_, i) =>
      file(`f${i}`)
    )
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {
        d1: loaded([...tooMany, dir('d2')]),
        d2: loaded([file('should-not-be-collected')])
      }
    })
    expect(res.isOverLimit).toBe(true)
    expect(res.dirIds).toEqual(['d1'])
    expect(res.dirIds).not.toContain('d2')
  })

  it('reports isEmpty when a resolved selection yields zero files', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([]) }
    })
    expect(res.isEmpty).toBe(true)
    expect(res.attachmentIds).toEqual([])
    expect(res.isLoading).toBe(false)
  })

  it('does not report isEmpty when files are resolved', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: { d1: loaded([file('f1')]) }
    })
    expect(res.isEmpty).toBe(false)
  })

  it('does not report isEmpty while still loading', () => {
    const root = dir('d1')
    const res = collectAttachmentsResolution({
      selectedDocs: [root],
      pickedDocs: [root],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {}
    })
    expect(res.isLoading).toBe(true)
    expect(res.isEmpty).toBe(false)
  })

  it('does not report isEmpty when unavailable', () => {
    const gone = file('f1')
    const res = collectAttachmentsResolution({
      selectedDocs: [gone],
      pickedDocs: [],
      pickedFetchStatus: 'loaded',
      resultsByDirId: {}
    })
    expect(res.isUnavailable).toBe(true)
    expect(res.isEmpty).toBe(false)
  })

  it('reports unavailable when a picked doc was deleted or trashed', () => {
    const gone = file('f1')
    const trashed = file('f2', { trashed: true })
    // deleted: absent from pickedDocs
    expect(
      collectAttachmentsResolution({
        selectedDocs: [gone],
        pickedDocs: [],
        pickedFetchStatus: 'loaded',
        resultsByDirId: {}
      }).isUnavailable
    ).toBe(true)
    // trashed: present but flagged
    expect(
      collectAttachmentsResolution({
        selectedDocs: [trashed],
        pickedDocs: [trashed],
        pickedFetchStatus: 'loaded',
        resultsByDirId: {}
      }).isUnavailable
    ).toBe(true)
  })
})

describe('isAttachmentsBlocked', () => {
  const okResolution = {
    attachmentIds: ['f1'],
    isOverLimit: false,
    isLoading: false,
    isUnavailable: false,
    isEmpty: false
  }

  it('never blocks without a selection', () => {
    expect(isAttachmentsBlocked(undefined, undefined)).toBe(false)
    expect(isAttachmentsBlocked([], undefined)).toBe(false)
  })

  it('blocks a selection with no resolution yet', () => {
    expect(isAttachmentsBlocked([file('f1')], undefined)).toBe(true)
  })

  it('blocks loading, over-limit and unavailable resolutions', () => {
    expect(
      isAttachmentsBlocked([file('f1')], { ...okResolution, isLoading: true })
    ).toBe(true)
    expect(
      isAttachmentsBlocked([file('f1')], { ...okResolution, isOverLimit: true })
    ).toBe(true)
    expect(
      isAttachmentsBlocked([file('f1')], {
        ...okResolution,
        isUnavailable: true
      })
    ).toBe(true)
  })

  it('blocks an empty resolved selection (must not silently search everything)', () => {
    expect(
      isAttachmentsBlocked([dir('d1')], { ...okResolution, isEmpty: true })
    ).toBe(true)
  })

  it('does not block a clean resolution', () => {
    expect(isAttachmentsBlocked([file('f1')], okResolution)).toBe(false)
  })
})

describe('buildFilesByDirIdQuery', () => {
  it('builds a named query on dir_id with a 5-minute fetch policy', () => {
    const query = buildFilesByDirIdQuery('dir-1')
    expect(query.options.as).toBe('io.cozy.files/by-dir-id/dir-1')
    expect(typeof query.options.fetchPolicy).toBe('function')
    const definition = query.definition()
    expect(definition.selector).toEqual({ dir_id: 'dir-1' })
    expect(definition.indexedFields).toEqual(['dir_id'])
    expect(definition.limit).toBe(1000)
  })
})
