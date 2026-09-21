import { renderHook } from '@testing-library/react-hooks/dom'

import { useClient } from 'cozy-client'

import {
  fetchWorkspaceFileCount,
  useWorkspaceFileCount
} from './workspaceFiles'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('cozy-minilog', () => () => ({ warn: jest.fn() }), {
  virtual: true
})

const makeClient = fetchJSON => ({ stackClient: { fetchJSON } })

describe('fetchWorkspaceFileCount', () => {
  it('returns the file count of the folder workspace', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      data: { attributes: { file_ids: ['f1', 'f2'], file_count: 2 } }
    })
    await expect(
      fetchWorkspaceFileCount(makeClient(fetchJSON), 'dir/1')
    ).resolves.toBe(2)
    expect(fetchJSON).toHaveBeenCalledWith(
      'GET',
      '/ai/workspaces/dir%2F1/files'
    )
  })

  it('returns null when the folder has no workspace yet', async () => {
    const fetchJSON = jest.fn().mockRejectedValue({ status: 404 })
    await expect(
      fetchWorkspaceFileCount(makeClient(fetchJSON), 'dir')
    ).resolves.toBeNull()
  })

  it('throws the other errors', async () => {
    const error = { status: 502 }
    const fetchJSON = jest.fn().mockRejectedValue(error)
    await expect(
      fetchWorkspaceFileCount(makeClient(fetchJSON), 'dir')
    ).rejects.toBe(error)
  })
})

describe('useWorkspaceFileCount', () => {
  let fetchJSON

  beforeEach(() => {
    fetchJSON = jest.fn()
    useClient.mockReturnValue(makeClient(fetchJSON))
  })

  it('does not fetch without a folder', () => {
    const { result } = renderHook(() => useWorkspaceFileCount(null))
    expect(result.current).toEqual({ fileCount: null, fetchStatus: 'pending' })
    expect(fetchJSON).not.toHaveBeenCalled()
  })

  it('loads the count of the folder', async () => {
    fetchJSON.mockResolvedValue({ data: { attributes: { file_count: 3 } } })
    const { result, waitForNextUpdate } = renderHook(() =>
      useWorkspaceFileCount('dir')
    )
    expect(result.current.fetchStatus).toBe('loading')
    await waitForNextUpdate()
    expect(result.current).toEqual({ fileCount: 3, fetchStatus: 'loaded' })
  })

  it('is loaded with a null count when the folder is not indexed yet', async () => {
    fetchJSON.mockRejectedValue({ status: 404 })
    const { result, waitForNextUpdate } = renderHook(() =>
      useWorkspaceFileCount('dir')
    )
    await waitForNextUpdate()
    expect(result.current).toEqual({ fileCount: null, fetchStatus: 'loaded' })
  })

  it('fails without throwing', async () => {
    fetchJSON.mockRejectedValue(new Error('boom'))
    const { result, waitForNextUpdate } = renderHook(() =>
      useWorkspaceFileCount('dir')
    )
    await waitForNextUpdate()
    expect(result.current).toEqual({ fileCount: null, fetchStatus: 'failed' })
  })

  it('fetches again when the folder changes', async () => {
    fetchJSON.mockResolvedValue({ data: { attributes: { file_count: 1 } } })
    const { rerender, waitForNextUpdate } = renderHook(
      ({ dirId }) => useWorkspaceFileCount(dirId),
      { initialProps: { dirId: 'a' } }
    )
    await waitForNextUpdate()
    rerender({ dirId: 'b' })
    await waitForNextUpdate()
    expect(fetchJSON).toHaveBeenCalledTimes(2)
    expect(fetchJSON).toHaveBeenLastCalledWith('GET', '/ai/workspaces/b/files')
  })
})
