import { renderHook } from '@testing-library/react-hooks/dom'

import { useClient } from 'cozy-client'
import { useDataProxy } from 'cozy-dataproxy-lib'

import { searchFilesOnStack } from './searchFiles'
import { useFetchResult } from './useFetchResult'

jest.mock('cozy-client', () => ({ useClient: jest.fn() }))
jest.mock('cozy-dataproxy-lib', () => ({ useDataProxy: jest.fn() }))
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }))
jest.mock('./getIconForSearchResult', () => ({
  getIconForSearchResult: () => ({ type: 'component' })
}))
jest.mock('./searchFiles', () => ({ searchFilesOnStack: jest.fn() }))

const result = title => ({
  doc: { _id: title },
  slug: 'drive',
  title,
  subTitle: '/',
  url: 'https://drive.example/#/folder/x'
})

describe('useFetchResult', () => {
  beforeEach(() => {
    useClient.mockReturnValue({ appMetadata: { slug: 'drive' } })
    searchFilesOnStack.mockReset()
  })

  it('uses the stack search without DataProxy', async () => {
    const dataProxy = { dataProxyServicesAvailable: false, search: jest.fn() }
    useDataProxy.mockReturnValue(dataProxy)
    searchFilesOnStack.mockResolvedValue([result('Report.pdf')])

    const { result: hook, waitFor } = renderHook(() => useFetchResult('rep'))
    await waitFor(() => expect(hook.current.isLoading).toBe(false))

    expect(hook.current.results.map(r => r.primary)).toEqual(['Report.pdf'])
    expect(dataProxy.search).not.toHaveBeenCalled()
  })

  it('falls back on DataProxy, once it is ready', async () => {
    searchFilesOnStack.mockResolvedValue(null)
    let dataProxy = { dataProxyServicesAvailable: false, search: jest.fn() }
    useDataProxy.mockImplementation(() => dataProxy)

    const {
      result: hook,
      rerender,
      waitFor
    } = renderHook(() => useFetchResult('rep'))
    await waitFor(() => expect(hook.current.isLoading).toBe(false))
    expect(hook.current.results).toEqual([])

    dataProxy = {
      dataProxyServicesAvailable: true,
      search: jest.fn().mockResolvedValue([result('Local.pdf')])
    }
    rerender()
    await waitFor(() =>
      expect(hook.current.results?.map(r => r.primary)).toEqual(['Local.pdf'])
    )
    expect(dataProxy.search).toHaveBeenCalledWith('rep', {})
  })
})
