import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useClient } from 'cozy-client'
import { useDataProxy } from 'cozy-dataproxy-lib'
import Minilog from 'cozy-minilog'

import { getIconForSearchResult } from './getIconForSearchResult'
import { searchFilesOnStack } from './searchFiles'

const log = Minilog('🔍 [useFetchResult]')

const searchWithRetry = async (dataProxy, searchValue, options = {}) => {
  const { maxRetries = 5, delay = 500, ...searchOptions } = options
  let currentDelay = delay
  // Make several search attemps in case it is not ready yet
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const searchResults = await dataProxy.search(searchValue, searchOptions)

    if (searchResults) {
      // A successful search will return an array, and null otherwise
      return searchResults
    }
    log.info(
      `Search attempt ${attempt + 1} failed, retrying in ${currentDelay} ms...`
    )
    await new Promise(resolve => setTimeout(resolve, currentDelay))
    currentDelay *= 2 // Exponential backoff
  }

  log.error(`Search failed after ${maxRetries} attempts`)
  return []
}

export const useFetchResult = (searchValue, searchOptions = {}) => {
  const client = useClient()
  const navigate = useNavigate()
  const [state, setState] = useState({
    isLoading: true,
    results: null,
    searchValue: null
  })
  const dataProxy = useDataProxy()

  useEffect(() => {
    const fetch = async (searchValue, searchOptions) => {
      setState({ isLoading: true, results: null, searchValue })

      let searchResults
      try {
        searchResults = await searchFilesOnStack(client, searchValue)
      } catch (err) {
        log.error('Stack search failed', err)
        searchResults = []
      }
      if (searchResults === null) {
        // The stack cannot search: fall back on DataProxy
        if (!dataProxy.dataProxyServicesAvailable) {
          log.log('DataProxy services are not available. Skipping search...')
          // Searched again once DataProxy is ready
          setState({
            isLoading: false,
            results: [],
            searchValue,
            pendingDataProxy: true
          })
          return
        }
        searchResults = await searchWithRetry(
          dataProxy,
          searchValue,
          searchOptions
        )
      }

      const results = searchResults.map(r => {
        // Begin Retrocompatibility code, to be removed when following PR is merged: https://github.com/cozy/cozy-web-data-proxy/pull/10
        r.slug = r.slug || r.type
        r.subTitle = r.subTitle || r.name
        // End Retrocompatibility code
        const icon = getIconForSearchResult(r)
        return {
          id: r.doc._id,
          icon: icon,
          slug: r.slug,
          url: r.url,
          secondaryUrl: r.secondaryUrl,
          primary: r.title,
          secondary: r.subTitle,
          onClick: () => {
            if (r.slug === client.appMetadata.slug) {
              try {
                const url = new URL(r.url)
                const hash = url.hash.replace('#', '')
                navigate(hash)
              } catch {
                window.open(r.url)
              }
            } else {
              window.open(r.url)
            }
          }
        }
      })

      setState({ isLoading: false, results, searchValue })
    }

    if (searchValue) {
      if (
        searchValue !== state.searchValue ||
        (state.pendingDataProxy && dataProxy.dataProxyServicesAvailable)
      ) {
        fetch(searchValue, searchOptions)
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ isLoading: true, results: null, searchValue: null })
    }
  }, [
    client,
    dataProxy,
    searchValue,
    state.searchValue,
    state.pendingDataProxy,
    setState
  ])

  return {
    isLoading: state.isLoading,
    results: state.results
  }
}
