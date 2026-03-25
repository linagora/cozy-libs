import { render } from '@testing-library/react'
import React from 'react'
import { BarLike } from 'test/lib/BarLike'

import { createMockClient } from 'cozy-client'
import { useInstanceInfo, useQuery } from 'cozy-client'
import { shouldDisplayOffers } from 'cozy-client/dist/models/instance'
import { isFlagshipApp } from 'cozy-device-helper'
import { useBreakpoints } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { Bar } from './Bar'

jest.mock('cozy-device-helper', () => ({
  ...jest.requireActual('cozy-device-helper'),
  isFlagshipApp: jest.fn()
}))

jest.mock('cozy-client', () => ({
  ...jest.requireActual('cozy-client'),
  useInstanceInfo: jest.fn(),
  useQuery: jest.fn(),
  RealTimeQueries: () => null
}))

jest.mock('cozy-client/dist/models/instance', () => ({
  ...jest.requireActual('cozy-client/dist/models/instance'),
  shouldDisplayOffers: jest.fn()
}))

jest.mock('cozy-ui/transpiled/react/providers/Breakpoints', () => ({
  ...jest.requireActual('cozy-ui/transpiled/react/providers/Breakpoints'),
  __esModule: true,
  useBreakpoints: jest.fn()
}))

describe('Bar', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    useBreakpoints.mockReturnValue({ isMobile: true })
    shouldDisplayOffers.mockReturnValue(false)
    useInstanceInfo.mockReturnValue({
      isLoaded: true,
      diskUsage: { data: { used: 0 } },
      instance: { data: {} },
      context: { data: {} }
    })
    useQuery.mockReturnValue({
      data: [],
      fetchStatus: 'loaded'
    })
  })

  afterEach(() => {
    isFlagshipApp.mockClear()
  })

  const setup = ({ isPublic = false } = {}) => {
    const mockClient = createMockClient({
      clientOptions: {
        uri: 'http://cozy.localhost:8080'
      }
    })

    const result = render(
      <BarLike client={mockClient}>
        <Bar
          isPublic={isPublic}
          onDrawer={jest.fn()}
          searchOptions={{ enabled: false }}
        />
      </BarLike>
    )

    return {
      ...result,
      client: mockClient
    }
  }

  it('should render the bar', () => {
    setup()
    expect(useQuery).toHaveBeenCalled()
  })

  it('should not fetch apps if public', () => {
    setup({ isPublic: true })
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )
  })
})
